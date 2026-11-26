//! Sorteo reutilizable por compromiso y revelación.
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short,
    xdr::ToXdr, Address, Bytes, BytesN, Env, Map, Vec,
};

const MAX_PARTICIPANTS: u32 = 100;
const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotFound = 1,
    BadDeadlines = 2,
    TooFew = 3,
    TooMany = 4,
    Duplicate = 5,
    NotParticipant = 6,
    AlreadyCommitted = 7,
    CommitClosed = 8,
    RevealNotOpen = 9,
    RevealClosed = 10,
    NoCommit = 11,
    BadReveal = 12,
    NotReady = 13,
    Finalized = 14,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DrawState {
    Commit,
    Reveal,
    Ready,
    Finalized,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DrawInfo {
    pub state: DrawState,
    pub commit_deadline: u64,
    pub reveal_deadline: u64,
    pub committed: u32,
    pub revealed: u32,
    pub order: Vec<Address>,
    pub fallback: bool,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    LastId,
    Draw(u32),
}

#[contracttype]
#[derive(Clone)]
struct Draw {
    participants: Vec<Address>,
    commit_deadline: u64,
    reveal_deadline: u64,
    // La posición de cada dirección en participants es fija desde create.
    commitments: Map<u32, BytesN<32>>,
    secrets: Map<u32, BytesN<32>>,
    order: Vec<Address>,
    fallback: bool,
}

impl Draw {
    fn state(&self, now: u64) -> DrawState {
        if !self.order.is_empty() {
            DrawState::Finalized
        } else if now >= self.reveal_deadline || self.secrets.len() == self.participants.len() {
            DrawState::Ready
        } else if now >= self.commit_deadline {
            DrawState::Reveal
        } else {
            DrawState::Commit
        }
    }

    fn participant_index(&self, env: &Env, participant: &Address) -> u32 {
        self.participants
            .first_index_of(participant)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotParticipant))
    }
}

fn load(env: &Env, id: u32) -> Draw {
    env.storage()
        .persistent()
        .get(&Key::Draw(id))
        .unwrap_or_else(|| panic_with_error!(env, Error::NotFound))
}

fn save(env: &Env, id: u32, draw: &Draw) {
    let key = Key::Draw(id);
    let storage = env.storage().persistent();
    storage.set(&key, draw);
    storage.extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
    env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

fn revealed_order(env: &Env, draw: &Draw) -> Vec<Address> {
    let mut xor = [0u8; 32];
    for (_, secret) in draw.secrets.iter() {
        for (byte, value) in xor.iter_mut().zip(secret.to_array()) {
            *byte ^= value;
        }
    }
    let mut input = Bytes::from_slice(env, &xor);
    input.extend_from_array(&env.ledger().sequence().to_be_bytes());
    let seed = env.crypto().sha256(&input).to_bytes().into_bytes();

    // Fisher-Yates sobre posiciones para conservar intacta la lista de inscripción.
    let mut indices = [0u32; MAX_PARTICIPANTS as usize];
    let indices = &mut indices[..draw.participants.len() as usize];
    for (i, slot) in indices.iter_mut().enumerate() {
        *slot = i as u32;
    }
    for i in (1..indices.len() as u32).rev() {
        let mut input = seed.clone();
        input.extend_from_array(&i.to_be_bytes());
        let digest = env.crypto().sha256(&input).to_array();
        // Reducir los 32 bytes como un entero big-endian, sin truncarlo.
        let j = digest
            .iter()
            .fold(0u32, |r, &b| (r * 256 + u32::from(b)) % (i + 1));
        indices.swap(i as usize, j as usize);
    }

    let mut first = Vec::new(env);
    let mut last = Vec::new(env);
    for &index in indices.iter() {
        let address = draw.participants.get(index).unwrap();
        if draw.secrets.contains_key(index) {
            first.push_back(address);
        } else {
            last.push_back(address);
        }
    }
    first.append(&last);
    first
}

#[contract]
pub struct Sorteo;

#[allow(deprecated)]
#[contractimpl]
impl Sorteo {
    pub fn create(
        env: Env,
        organizer: Address,
        participants: Vec<Address>,
        commit_deadline: u64,
        reveal_deadline: u64,
    ) -> u32 {
        organizer.require_auth();
        if participants.len() < 2 {
            panic_with_error!(&env, Error::TooFew);
        }
        if participants.len() > MAX_PARTICIPANTS {
            panic_with_error!(&env, Error::TooMany);
        }
        if env.ledger().timestamp() >= commit_deadline || commit_deadline >= reveal_deadline {
            panic_with_error!(&env, Error::BadDeadlines);
        }
        let mut seen = Map::new(&env);
        for address in participants.iter() {
            if seen.contains_key(address.clone()) {
                panic_with_error!(&env, Error::Duplicate);
            }
            seen.set(address, ());
        }
        let instance = env.storage().instance();
        let last_id: u32 = instance.get(&Key::LastId).unwrap_or(0);
        let id = last_id.checked_add(1).unwrap();
        instance.set(&Key::LastId, &id);
        save(
            &env,
            id,
            &Draw {
                participants,
                commit_deadline,
                reveal_deadline,
                commitments: Map::new(&env),
                secrets: Map::new(&env),
                order: Vec::new(&env),
                fallback: false,
            },
        );
        id
    }

    pub fn commit(env: Env, id: u32, participant: Address, hash: BytesN<32>) {
        participant.require_auth();
        let mut draw = load(&env, id);
        if !draw.order.is_empty() {
            panic_with_error!(&env, Error::Finalized);
        }
        if env.ledger().timestamp() >= draw.commit_deadline {
            panic_with_error!(&env, Error::CommitClosed);
        }
        let index = draw.participant_index(&env, &participant);
        if draw.commitments.contains_key(index) {
            panic_with_error!(&env, Error::AlreadyCommitted);
        }
        draw.commitments.set(index, hash);
        save(&env, id, &draw);
        env.events()
            .publish((symbol_short!("commit"), id), participant);
    }

    pub fn reveal(env: Env, id: u32, participant: Address, secret: BytesN<32>) {
        participant.require_auth();
        let mut draw = load(&env, id);
        if !draw.order.is_empty() {
            panic_with_error!(&env, Error::Finalized);
        }
        let now = env.ledger().timestamp();
        if now < draw.commit_deadline {
            panic_with_error!(&env, Error::RevealNotOpen);
        }
        if now >= draw.reveal_deadline {
            panic_with_error!(&env, Error::RevealClosed);
        }
        let index = draw.participant_index(&env, &participant);
        let hash = draw
            .commitments
            .get(index)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NoCommit));
        let mut input = secret.to_bytes();
        input.append(&participant.clone().to_xdr(&env));
        if env.crypto().sha256(&input).to_bytes() != hash {
            panic_with_error!(&env, Error::BadReveal);
        }
        // Reenviar una revelación válida no duplica el conteo ni el evento.
        if draw.secrets.contains_key(index) {
            return;
        }
        draw.secrets.set(index, secret);
        save(&env, id, &draw);
        env.events()
            .publish((symbol_short!("reveal"), id), participant);
    }

    pub fn finalize(env: Env, id: u32) -> Vec<Address> {
        let mut draw = load(&env, id);
        match draw.state(env.ledger().timestamp()) {
            DrawState::Finalized => panic_with_error!(&env, Error::Finalized),
            DrawState::Ready => (),
            _ => panic_with_error!(&env, Error::NotReady),
        }
        draw.fallback = draw.secrets.is_empty();
        draw.order = if draw.fallback {
            let mut order = draw.participants.clone();
            env.prng().shuffle(&mut order);
            order
        } else {
            revealed_order(&env, &draw)
        };
        save(&env, id, &draw);
        env.events()
            .publish((symbol_short!("final"), id), draw.fallback);
        draw.order
    }

    pub fn get(env: Env, id: u32) -> DrawInfo {
        let draw = load(&env, id);
        DrawInfo {
            state: draw.state(env.ledger().timestamp()),
            commit_deadline: draw.commit_deadline,
            reveal_deadline: draw.reveal_deadline,
            committed: draw.commitments.len(),
            revealed: draw.secrets.len(),
            order: draw.order,
            fallback: draw.fallback,
        }
    }

    pub fn version(_env: Env) -> u32 {
        1
    }
}

#[cfg(test)]
mod test;
