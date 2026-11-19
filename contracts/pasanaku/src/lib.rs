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
    Address, Env, Map, String, Vec,
};

/// Marcas del historial de cada miembro.
pub const ON_TIME: u32 = 1;
pub const LATE: u32 = 2;
pub const MISSED: u32 = 3;
/// Faltó, pero su garantía cubrió la cuota: quien cobra recibe el pozo completo.
pub const COVERED: u32 = 4;

/// Versión del contrato (la web la usa para saber qué funciones existen).
pub const VERSION: u32 = 3;
const MAX_ALIAS: u32 = 24;
/// Una ronda dura como máximo 90 días: así cada ronda renueva el TTL de los
/// datos de todos los miembros (120 días) antes de que venza.
pub const MAX_PERIOD: u64 = 90 * 24 * 3600;

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
    AlreadyGuaranteed = 9,
    NoGuarantee = 10,
    CircleNotFinished = 11,
    InvalidAlias = 12,
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
    /// Cuotas efectivamente recibidas en esta ronda.
    pub pot: i128,
    /// Miembros que no aportaron todavía pero tienen garantía para cubrir la cuota.
    pub covered: u32,
}

/// Estado de un miembro en la ronda actual, para la web.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct MemberInfo {
    pub address: Address,
    /// Marca de la ronda actual (0 si todavía no aportó).
    pub paid: u32,
    /// Garantía depositada que queda disponible.
    pub guarantee: i128,
    pub alias: Option<String>,
    pub score: u32,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Config,
    Round,
    Paid(u32),
    History(Address),
    Guarantee(Address),
    Alias(Address),
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

fn guarantee_of(env: &Env, member: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&Key::Guarantee(member.clone()))
        .unwrap_or(0)
}

fn set_guarantee(env: &Env, member: &Address, value: i128) {
    let key = Key::Guarantee(member.clone());
    env.storage().persistent().set(&key, &value);
    env.storage()
        .persistent()
        .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}

/// Renueva el TTL de todo lo que guarda un miembro (historial, garantía, alias),
/// para que nada venza mientras el círculo sigue activo.
fn touch_member(env: &Env, member: &Address) {
    let st = env.storage().persistent();
    for key in [
        Key::History(member.clone()),
        Key::Guarantee(member.clone()),
        Key::Alias(member.clone()),
    ] {
        if st.has(&key) {
            st.extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        }
    }
}

/// Un alias válido: UTF-8, sin caracteres de control, sin caracteres invisibles
/// ni de dirección bidireccional (que permiten nombres engañosos).
fn valid_alias(alias: &String) -> bool {
    let n = alias.len();
    if n == 0 || n > MAX_ALIAS {
        return false;
    }
    let mut buf = [0u8; MAX_ALIAS as usize];
    let bytes = &mut buf[..n as usize];
    alias.copy_into_slice(bytes);
    if core::str::from_utf8(bytes).is_err() {
        return false;
    }
    for (i, b) in bytes.iter().enumerate() {
        if *b < 0x20 || *b == 0x7f {
            return false;
        }
        // U+200B..U+200F (ancho cero y marcas de dirección), U+202A..U+202E y U+2066..U+2069
        if *b == 0xE2 && i + 2 < bytes.len() {
            let (b1, b2) = (bytes[i + 1], bytes[i + 2]);
            if b1 == 0x80 && ((0x8B..=0x8F).contains(&b2) || (0xAA..=0xAE).contains(&b2)) {
                return false;
            }
            if b1 == 0x81 && (0xA6..=0xA9).contains(&b2) {
                return false;
            }
        }
    }
    true
}

fn require_member(env: &Env, cfg: &Config, member: &Address) {
    if !cfg.members.contains(member) {
        panic_with_error!(env, Error::NotMember);
    }
}

fn score_of(h: &Vec<u32>) -> u32 {
    if h.is_empty() {
        return 0;
    }
    let mut pts = 0u32;
    for m in h.iter() {
        pts += match m {
            ON_TIME => 100,
            LATE => 50,
            COVERED => 25,
            _ => 0,
        };
    }
    pts / h.len()
}

fn bump(env: &Env) {
    env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

// Los eventos usan publish (obsoleto en sdk 28 pero válido); migrar a #[contractevent] luego.
#[allow(deprecated)]
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
        if period == 0 || period > MAX_PERIOD {
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
        require_member(&env, &cfg, &member);
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
        touch_member(&env, &member);
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
        // Quien no aportó queda marcado; si dejó garantía, esta cubre su cuota.
        let mut covered = 0i128;
        for m in cfg.members.iter() {
            if !paid.contains_key(m.clone()) {
                let g = guarantee_of(&env, &m);
                if g >= cfg.amount {
                    set_guarantee(&env, &m, g - cfg.amount);
                    covered += 1;
                    push_mark(&env, &m, COVERED);
                    env.events()
                        .publish((symbol_short!("cubre"), m.clone()), (round, cfg.amount));
                } else {
                    push_mark(&env, &m, MISSED);
                }
            }
        }

        // Cada ronda renueva los datos de todos los miembros
        for m in cfg.members.iter() {
            touch_member(&env, &m);
        }

        let recipient = cfg.members.get(round).unwrap();
        let pot = cfg.amount * (paid.len() as i128 + covered);
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

    /// Deposita una cuota como garantía. Si algún día el miembro no paga, la
    /// garantía cubre esa ronda; lo que sobre se retira al terminar el círculo.
    pub fn deposit_guarantee(env: Env, member: Address) {
        member.require_auth();
        let cfg = config(&env);
        require_member(&env, &cfg, &member);
        if current_round(&env) >= cfg.members.len() {
            panic_with_error!(&env, Error::CircleFinished);
        }
        if guarantee_of(&env, &member) > 0 {
            panic_with_error!(&env, Error::AlreadyGuaranteed);
        }
        token::Client::new(&env, &cfg.token).transfer(
            &member,
            &env.current_contract_address(),
            &cfg.amount,
        );
        set_guarantee(&env, &member, cfg.amount);
        bump(&env);
        env.events()
            .publish((symbol_short!("garantia"), member), cfg.amount);
    }

    /// Devuelve la garantía que quedó, una vez terminado el círculo.
    pub fn withdraw_guarantee(env: Env, member: Address) -> i128 {
        member.require_auth();
        let cfg = config(&env);
        if current_round(&env) < cfg.members.len() {
            panic_with_error!(&env, Error::CircleNotFinished);
        }
        let g = guarantee_of(&env, &member);
        if g <= 0 {
            panic_with_error!(&env, Error::NoGuarantee);
        }
        set_guarantee(&env, &member, 0);
        token::Client::new(&env, &cfg.token).transfer(&env.current_contract_address(), &member, &g);
        env.events()
            .publish((symbol_short!("devuelve"), member), g);
        g
    }

    /// Nombre visible del miembro (máximo 24 caracteres), guardado en la cadena.
    pub fn set_alias(env: Env, member: Address, alias: String) {
        member.require_auth();
        let cfg = config(&env);
        require_member(&env, &cfg, &member);
        if !valid_alias(&alias) {
            panic_with_error!(&env, Error::InvalidAlias);
        }
        let key = Key::Alias(member);
        env.storage().persistent().set(&key, &alias);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        bump(&env);
    }

    /// Estado de todos los miembros en la ronda actual (en orden de cobro).
    /// Ojo: todo lo que guarda un contrato en Stellar es público; esta vista
    /// solo lo junta. Los miembros aceptan que su alias, marcas y garantía se vean.
    pub fn members(env: Env) -> Vec<MemberInfo> {
        let cfg = config(&env);
        let paid = paid_map(&env, current_round(&env));
        let mut out = Vec::new(&env);
        for m in cfg.members.iter() {
            let h: Vec<u32> = env
                .storage()
                .persistent()
                .get(&Key::History(m.clone()))
                .unwrap_or(Vec::new(&env));
            out.push_back(MemberInfo {
                paid: paid.get(m.clone()).unwrap_or(0),
                guarantee: guarantee_of(&env, &m),
                alias: env.storage().persistent().get(&Key::Alias(m.clone())),
                score: score_of(&h),
                address: m,
            });
        }
        out
    }

    pub fn version(_env: Env) -> u32 {
        VERSION
    }

    pub fn get_config(env: Env) -> Config {
        config(&env)
    }

    pub fn round_info(env: Env) -> RoundInfo {
        let cfg = config(&env);
        let round = current_round(&env);
        let paid = paid_map(&env, round);
        let mut covered = 0u32;
        if round < cfg.members.len() {
            for m in cfg.members.iter() {
                if !paid.contains_key(m.clone()) && guarantee_of(&env, &m) >= cfg.amount {
                    covered += 1;
                }
            }
        }
        RoundInfo {
            round,
            recipient: cfg.members.get(round),
            deadline: deadline(&cfg, round),
            paid: paid.len(),
            pot: cfg.amount * paid.len() as i128,
            covered,
        }
    }

    /// Marcas de cada ronda del miembro (1 a tiempo, 2 tarde, 3 faltó, 4 cubierto).
    pub fn history(env: Env, member: Address) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&Key::History(member))
            .unwrap_or(Vec::new(&env))
    }

    /// Reputación de 0 a 100: a tiempo vale 100, tarde 50, cubierto por la
    /// garantía 25 y faltar 0. Sin historial devuelve 0.
    pub fn score(env: Env, member: Address) -> u32 {
        score_of(&Self::history(env, member))
    }
}

mod test;
