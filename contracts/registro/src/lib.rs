//! Registro público de los círculos de Awayu y de las participaciones que sus
//! miembros declaran para reunir su historial en un pasaporte portable.
#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, panic_with_error,
    symbol_short, Address, Env, String, Symbol, Vec,
};

const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_LEDGERS;
const MAX_NAME: u32 = 40;
const MAX_PAGE: u32 = 50;

pub const VERSION: u32 = 1;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidName = 1,
    InvalidRegion = 2,
    CircleAlreadyRegistered = 3,
    InvalidLimit = 4,
    NotMember = 5,
    AlreadyEndorsed = 6,
    NotJoined = 7,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Ficha {
    pub circle: Address,
    pub creator: Address,
    pub name: String,
    pub region: Symbol,
    pub created: u64,
    pub index: u32,
}

/// Esquema de `get_config` en contracts/pasanaku. El nombre y los campos se
/// conservan para que Soroban pueda decodificar la respuesta del otro contrato.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub token: Address,
    pub amount: i128,
    pub period: u64,
    pub start: u64,
    pub members: Vec<Address>,
}

#[contractclient(name = "PasanakuClient")]
pub trait PasanakuInterface {
    fn get_config(env: Env) -> Config;
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Count,
    Ficha(u32),
    Circle(Address),
    Region(Symbol),
    Member(Address),
    Endorsed(Address, Address),
    Endorsements(Address),
}

#[contract]
pub struct Registro;

fn bump(env: &Env) {
    env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

fn touch(env: &Env, key: &Key) {
    let storage = env.storage().persistent();
    if storage.has(key) {
        storage.extend_ttl(key, BUMP_THRESHOLD, BUMP_TO);
    }
}

fn save<T: soroban_sdk::IntoVal<Env, soroban_sdk::Val>>(env: &Env, key: &Key, value: &T) {
    env.storage().persistent().set(key, value);
    env.storage()
        .persistent()
        .extend_ttl(key, BUMP_THRESHOLD, BUMP_TO);
}

fn count_value(env: &Env) -> u32 {
    env.storage().instance().get(&Key::Count).unwrap_or(0)
}

fn valid_region(region: &Symbol) -> bool {
    *region == symbol_short!("lpz")
        || *region == symbol_short!("cbba")
        || *region == symbol_short!("scz")
        || *region == symbol_short!("oru")
        || *region == symbol_short!("pts")
        || *region == symbol_short!("chq")
        || *region == symbol_short!("trj")
        || *region == symbol_short!("ben")
        || *region == symbol_short!("pnd")
        || *region == symbol_short!("otro")
}

fn valid_name(name: &String) -> bool {
    let len = name.len();
    if len == 0 || len > MAX_NAME {
        return false;
    }
    let mut buf = [0u8; MAX_NAME as usize];
    let bytes = &mut buf[..len as usize];
    name.copy_into_slice(bytes);
    match core::str::from_utf8(bytes) {
        Ok(text) => !text.chars().any(char::is_control),
        Err(_) => false,
    }
}

fn address_list(env: &Env, key: &Key) -> Vec<Address> {
    let out = env.storage().persistent().get(key).unwrap_or(Vec::new(env));
    touch(env, key);
    out
}

fn has_joined(env: &Env, member: &Address, circle: &Address) -> bool {
    let key = Key::Member(member.clone());
    address_list(env, &key).contains(circle)
}

// Los eventos usan publish (obsoleto en sdk 28 pero válido).
#[allow(deprecated)]
#[contractimpl]
impl Registro {
    pub fn __constructor(env: Env) {
        env.storage().instance().set(&Key::Count, &0u32);
        bump(&env);
    }

    /// Registra una sola ficha por contrato de pasanaku.
    pub fn register(
        env: Env,
        creator: Address,
        circle: Address,
        name: String,
        region: Symbol,
    ) -> u32 {
        creator.require_auth();
        if !valid_name(&name) {
            panic_with_error!(&env, Error::InvalidName);
        }
        if !valid_region(&region) {
            panic_with_error!(&env, Error::InvalidRegion);
        }
        let circle_key = Key::Circle(circle.clone());
        if env.storage().persistent().has(&circle_key) {
            touch(&env, &circle_key);
            panic_with_error!(&env, Error::CircleAlreadyRegistered);
        }

        let index = count_value(&env);
        let ficha = Ficha {
            circle: circle.clone(),
            creator: creator.clone(),
            name,
            region: region.clone(),
            created: env.ledger().timestamp(),
            index,
        };
        save(&env, &Key::Ficha(index), &ficha);
        save(&env, &circle_key, &index);

        let region_key = Key::Region(region.clone());
        let mut circles = address_list(&env, &region_key);
        circles.push_back(circle.clone());
        save(&env, &region_key, &circles);

        env.storage().instance().set(&Key::Count, &(index + 1));
        bump(&env);
        env.events().publish(
            (symbol_short!("registro"), circle.clone()),
            (creator, index, region),
        );
        index
    }

    pub fn count(env: Env) -> u32 {
        bump(&env);
        count_value(&env)
    }

    pub fn get(env: Env, index: u32) -> Ficha {
        let key = Key::Ficha(index);
        let ficha = env.storage().persistent().get(&key).unwrap();
        touch(&env, &key);
        bump(&env);
        ficha
    }

    /// Devuelve hasta `limit` fichas desde `start`; `limit` válido es 1..=50.
    pub fn page(env: Env, start: u32, limit: u32) -> Vec<Ficha> {
        if limit == 0 || limit > MAX_PAGE {
            panic_with_error!(&env, Error::InvalidLimit);
        }
        let mut out = Vec::new(&env);
        let end = core::cmp::min(start.saturating_add(limit), count_value(&env));
        for index in start..end {
            let key = Key::Ficha(index);
            if let Some(ficha) = env.storage().persistent().get(&key) {
                touch(&env, &key);
                out.push_back(ficha);
            }
        }
        bump(&env);
        out
    }

    pub fn by_region(env: Env, region: Symbol) -> Vec<Address> {
        if !valid_region(&region) {
            panic_with_error!(&env, Error::InvalidRegion);
        }
        let out = address_list(&env, &Key::Region(region));
        bump(&env);
        out
    }

    /// Declara participación solo si la configuración del círculo confirma
    /// que la dirección aparece entre sus miembros.
    pub fn join(env: Env, member: Address, circle: Address) {
        member.require_auth();
        let cfg = PasanakuClient::new(&env, &circle).get_config();
        if !cfg.members.contains(&member) {
            panic_with_error!(&env, Error::NotMember);
        }
        let key = Key::Member(member.clone());
        let mut circles = address_list(&env, &key);
        if !circles.contains(&circle) {
            circles.push_back(circle.clone());
            save(&env, &key, &circles);
        }
        bump(&env);
        env.events()
            .publish((symbol_short!("join"), member), circle);
    }

    pub fn by_member(env: Env, member: Address) -> Vec<Address> {
        let out = address_list(&env, &Key::Member(member));
        bump(&env);
        out
    }

    /// Un aval por dirección y círculo; solo pueden avalar participantes que
    /// ya declararon su pertenencia mediante `join`.
    pub fn endorse(env: Env, from: Address, circle: Address) {
        from.require_auth();
        if !has_joined(&env, &from, &circle) {
            panic_with_error!(&env, Error::NotJoined);
        }
        let key = Key::Endorsed(from.clone(), circle.clone());
        if env.storage().persistent().has(&key) {
            touch(&env, &key);
            panic_with_error!(&env, Error::AlreadyEndorsed);
        }
        save(&env, &key, &true);
        let count_key = Key::Endorsements(circle.clone());
        let n: u32 = env.storage().persistent().get(&count_key).unwrap_or(0);
        save(&env, &count_key, &(n + 1));
        bump(&env);
        env.events()
            .publish((symbol_short!("aval"), circle), (from, n + 1));
    }

    pub fn endorsements(env: Env, circle: Address) -> u32 {
        let key = Key::Endorsements(circle);
        let n = env.storage().persistent().get(&key).unwrap_or(0);
        touch(&env, &key);
        bump(&env);
        n
    }

    pub fn version(_env: Env) -> u32 {
        VERSION
    }
}

mod test;
