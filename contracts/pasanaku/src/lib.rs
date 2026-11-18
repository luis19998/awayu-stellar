//! Awayu: un pasanaku (círculo de ahorro rotativo) en Stellar.
//!
//! Cada ronda, todos los miembros aportan la misma cuota en un token (USDC en
//! testnet) y el pozo completo se paga a un miembro, en un orden sorteado en la
//! cadena al crear el círculo. Cada aporte deja una marca en el historial del
//! miembro (a tiempo, tarde o faltó): ese historial es el "aguayo" que la web
//! teje en 3D y la base de una reputación crediticia portable.
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, Map, Vec,
};

/// Marcas del historial de cada miembro.
pub const ON_TIME: u32 = 1;
pub const LATE: u32 = 2;
pub const MISSED: u32 = 3;

const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    TooFewMembers = 1,
    InvalidAmount = 2,
    InvalidPeriod = 3,
    DuplicateMember = 4,
    NotMember = 5,
    AlreadyPaid = 6,
    CircleFinished = 7,
    RoundStillOpen = 8,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub token: Address,
    /// Cuota por ronda, en las unidades mínimas del token (USDC: 7 decimales).
    pub amount: i128,
    /// Duración de cada ronda, en segundos.
    pub period: u64,
    /// Inicio del círculo (marca de tiempo del ledger).
    pub start: u64,
    /// Miembros en el orden en que reciben el pozo.
    pub members: Vec<Address>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct RoundInfo {
    pub round: u32,
    pub recipient: Option<Address>,
    pub deadline: u64,
    pub paid: u32,
    pub pot: i128,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Config,
    Round,
    Paid(u32),
    History(Address),
}

#[contract]
pub struct Pasanaku;

fn config(env: &Env) -> Config {
    env.storage().instance().get(&Key::Config).unwrap()
}

fn current_round(env: &Env) -> u32 {
    env.storage().instance().get(&Key::Round).unwrap_or(0)
}

fn deadline(cfg: &Config, round: u32) -> u64 {
    cfg.start + cfg.period * (round as u64 + 1)
}

fn paid_map(env: &Env, round: u32) -> Map<Address, u32> {
    env.storage()
        .persistent()
        .get(&Key::Paid(round))
        .unwrap_or(Map::new(env))
}

fn push_mark(env: &Env, member: &Address, mark: u32) {
    let key = Key::History(member.clone());
    let mut h: Vec<u32> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    h.push_back(mark);
    env.storage().persistent().set(&key, &h);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}

fn bump(env: &Env) {
    env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

#[contractimpl]
impl Pasanaku {
    /// Crea el círculo. El orden de cobro se sortea con el PRNG de la red, así
    /// nadie (ni el organizador) elige quién cobra primero.
    pub fn __constructor(
        env: Env,
        admin: Address,
        token: Address,
        amount: i128,
        period: u64,
        members: Vec<Address>,
    ) {
        if members.len() < 2 {
            panic_with_error!(&env, Error::TooFewMembers);
        }
        if amount <= 0 {
            panic_with_error!(&env, Error::InvalidAmount);
        }
        if period == 0 {
            panic_with_error!(&env, Error::InvalidPeriod);
        }
        let mut seen: Map<Address, bool> = Map::new(&env);
        for m in members.iter() {
            if seen.contains_key(m.clone()) {
                panic_with_error!(&env, Error::DuplicateMember);
            }
            seen.set(m, true);
        }
        let mut order = members.clone();
        env.prng().shuffle(&mut order);

        let cfg = Config {
            admin,
            token,
            amount,
            period,
            start: env.ledger().timestamp(),
            members: order,
        };
        env.storage().instance().set(&Key::Config, &cfg);
        env.storage().instance().set(&Key::Round, &0u32);
        bump(&env);
    }

    /// Aporta la cuota de la ronda actual.
    pub fn contribute(env: Env, member: Address) -> u32 {
        member.require_auth();
        let cfg = config(&env);
        let round = current_round(&env);
        if round >= cfg.members.len() {
            panic_with_error!(&env, Error::CircleFinished);
        }
        if !cfg.members.contains(&member) {
            panic_with_error!(&env, Error::NotMember);
        }
        let mut paid = paid_map(&env, round);
        if paid.contains_key(member.clone()) {
            panic_with_error!(&env, Error::AlreadyPaid);
        }

        token::Client::new(&env, &cfg.token).transfer(
            &member,
            &env.current_contract_address(),
            &cfg.amount,
        );

        let mark = if env.ledger().timestamp() <= deadline(&cfg, round) {
            ON_TIME
        } else {
            LATE
        };
        paid.set(member.clone(), mark);
        let key = Key::Paid(round);
        env.storage().persistent().set(&key, &paid);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        push_mark(&env, &member, mark);
        bump(&env);

        env.events()
            .publish((symbol_short!("aporte"), member), (round, mark, cfg.amount));
        mark
    }

    /// Paga el pozo de la ronda al miembro que le toca. Cualquiera puede
    /// llamarla cuando todos aportaron o cuando venció el plazo; quien no
    /// aportó queda marcado como "faltó" en su historial.
    pub fn payout(env: Env) -> Address {
        let cfg = config(&env);
        let round = current_round(&env);
        let n = cfg.members.len();
        if round >= n {
            panic_with_error!(&env, Error::CircleFinished);
        }
        let paid = paid_map(&env, round);
        let everyone = paid.len() == n;
        if !everyone && env.ledger().timestamp() <= deadline(&cfg, round) {
            panic_with_error!(&env, Error::RoundStillOpen);
        }
        for m in cfg.members.iter() {
            if !paid.contains_key(m.clone()) {
                push_mark(&env, &m, MISSED);
            }
        }

        let recipient = cfg.members.get(round).unwrap();
        let pot = cfg.amount * paid.len() as i128;
        if pot > 0 {
            token::Client::new(&env, &cfg.token).transfer(
                &env.current_contract_address(),
                &recipient,
                &pot,
            );
        }
        env.storage().instance().set(&Key::Round, &(round + 1));
        bump(&env);

        env.events()
            .publish((symbol_short!("pozo"), recipient.clone()), (round, pot));
        recipient
    }

    pub fn get_config(env: Env) -> Config {
        config(&env)
    }

    pub fn round_info(env: Env) -> RoundInfo {
        let cfg = config(&env);
        let round = current_round(&env);
        let paid = paid_map(&env, round);
        RoundInfo {
            round,
            recipient: cfg.members.get(round),
            deadline: deadline(&cfg, round),
            paid: paid.len(),
            pot: cfg.amount * paid.len() as i128,
        }
    }

    /// Marcas de cada aporte del miembro (1 a tiempo, 2 tarde, 3 faltó).
    pub fn history(env: Env, member: Address) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&Key::History(member))
            .unwrap_or(Vec::new(&env))
    }

    /// Reputación de 0 a 100: a tiempo vale 100, tarde 50 y faltar 0.
    /// Sin historial devuelve 0.
    pub fn score(env: Env, member: Address) -> u32 {
        let h = Self::history(env, member);
        if h.is_empty() {
            return 0;
        }
        let mut pts = 0u32;
        for m in h.iter() {
            pts += match m {
                ON_TIME => 100,
                LATE => 50,
                _ => 0,
            };
        }
        pts / h.len()
    }
}

mod test;
