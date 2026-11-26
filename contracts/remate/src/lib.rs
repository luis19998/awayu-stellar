//! Junta con remate: cada persona cobra una vez y puede ofrecer un descuento
//! a quienes aportaron en la ronda para adelantar su turno.
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, Map, Vec,
};

const ON_TIME: u32 = 1;
const LATE: u32 = 2;
const MISSED: u32 = 3;
const COVERED: u32 = 4;
const MAX_PERIOD: u64 = 90 * 24 * 3600;
const BUMP_THRESHOLD: u32 = 91 * 17_280;
const BUMP_TO: u32 = 120 * 17_280;
const MAX_BPS: u32 = 5000;
const BPS_PER_UNIT: i128 = 10_000;

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
    AlreadyWon = 12,
    NotContributed = 13,
    BidTooHigh = 14,
    BidLower = 15,
    BidDeadlinePassed = 16,
}

#[contracttype]
#[derive(Clone)]
struct Config {
    admin: Address,
    token: Address,
    amount: i128,
    period: u64,
    start: u64,
    members: Vec<Address>,
}

#[contracttype]
#[derive(Clone)]
struct Round {
    index: u32,
    paid: u32,
    carry: i128,
}

#[contracttype]
#[derive(Clone)]
struct Member {
    guarantee: i128,
    won: bool,
    history: Vec<u32>,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct MemberInfo {
    pub address: Address,
    pub guarantee: i128,
    pub won: bool,
    pub paid: u32,
    pub history: Vec<u32>,
    pub score: u32,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct RoundInfo {
    pub round: u32,
    pub deadline: u64,
    pub paid: u32,
    pub covered: u32,
    /// Pozo ya disponible, incluido el sobrante anterior.
    pub pot: i128,
    pub carry: i128,
    /// Quien cobraría con las pujas actuales o con el orden de respaldo.
    pub recipient: Option<Address>,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Config,
    Round,
    Bids,
    Member(Address),
}

#[contract]
pub struct Remate;

fn config(env: &Env) -> Config {
    env.storage().instance().get(&Key::Config).unwrap()
}

fn round(env: &Env) -> Round {
    env.storage().instance().get(&Key::Round).unwrap()
}

fn active_round(env: &Env, cfg: &Config) -> Round {
    let r = round(env);
    if r.index >= cfg.members.len() {
        panic_with_error!(env, Error::CircleFinished);
    }
    r
}

fn deadline(cfg: &Config, index: u32) -> u64 {
    cfg.start + cfg.period * (u64::from(index) + 1)
}

fn require_member(env: &Env, cfg: &Config, address: &Address) {
    if !cfg.members.contains(address) {
        panic_with_error!(env, Error::NotMember);
    }
}

fn member_state(env: &Env, address: &Address) -> Member {
    env.storage()
        .persistent()
        .get(&Key::Member(address.clone()))
        .unwrap_or_else(|| Member {
            guarantee: 0,
            won: false,
            history: Vec::new(env),
        })
}

fn save_member(env: &Env, address: &Address, state: &Member) {
    let key = Key::Member(address.clone());
    let store = env.storage().persistent();
    store.set(&key, state);
    store.extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}

fn bump(env: &Env) {
    env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

fn score_of(history: &Vec<u32>) -> u32 {
    if history.is_empty() {
        return 0;
    }
    let points: u64 = history
        .iter()
        .map(|mark| match mark {
            ON_TIME => 100u64,
            LATE => 50,
            COVERED => 25,
            _ => 0,
        })
        .sum();
    (points / u64::from(history.len())) as u32
}

fn candidate(env: &Env, cfg: &Config) -> Option<(Address, u32)> {
    let mut best = None;
    for (address, bps) in Remate::bids(env.clone()).iter() {
        // El vector conserva el orden de la primera puja de cada persona.
        if best.as_ref().map_or(true, |(_, highest)| bps > *highest) {
            best = Some((address, bps));
        }
    }
    best.or_else(|| {
        cfg.members
            .iter()
            .find(|address| !member_state(env, address).won)
            .map(|address| (address, 0))
    })
}

fn discount_amount(pot: i128, discount_bps: u32) -> i128 {
    // Evita desbordar pot * bps antes de dividir, incluso para un pozo i128::MAX.
    let bps = i128::from(discount_bps);
    (pot / BPS_PER_UNIT) * bps + (pot % BPS_PER_UNIT) * bps / BPS_PER_UNIT
}

#[allow(deprecated)]
#[contractimpl]
impl Remate {
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
        let mut seen = Map::new(&env);
        for m in members.iter() {
            if seen.contains_key(m.clone()) {
                panic_with_error!(&env, Error::DuplicateMember);
            }
            seen.set(m, true);
        }
        let mut order = members;
        env.prng().shuffle(&mut order);
        let cfg = Config {
            admin,
            token,
            amount,
            period,
            start: env.ledger().timestamp(),
            members: order,
        };
        let store = env.storage().instance();
        store.set(&Key::Config, &cfg);
        store.set(
            &Key::Round,
            &Round {
                index: 0,
                paid: 0,
                carry: 0,
            },
        );
        bump(&env);
    }

    pub fn contribute(env: Env, member: Address) -> u32 {
        member.require_auth();
        let cfg = config(&env);
        let mut r = active_round(&env, &cfg);
        require_member(&env, &cfg, &member);
        let mut state = member_state(&env, &member);
        if state.history.get(r.index).is_some() {
            panic_with_error!(&env, Error::AlreadyPaid);
        }
        token::Client::new(&env, &cfg.token).transfer(
            &member,
            &env.current_contract_address(),
            &cfg.amount,
        );
        let mark = if env.ledger().timestamp() <= deadline(&cfg, r.index) {
            ON_TIME
        } else {
            LATE
        };
        state.history.push_back(mark);
        save_member(&env, &member, &state);
        r.paid += 1;
        env.storage().instance().set(&Key::Round, &r);
        bump(&env);
        env.events().publish(
            (symbol_short!("aporte"), member),
            (r.index, mark, cfg.amount),
        );
        mark
    }

    pub fn deposit_guarantee(env: Env, member: Address) {
        member.require_auth();
        let cfg = config(&env);
        require_member(&env, &cfg, &member);
        active_round(&env, &cfg);
        let mut state = member_state(&env, &member);
        if state.guarantee > 0 {
            panic_with_error!(&env, Error::AlreadyGuaranteed);
        }
        token::Client::new(&env, &cfg.token).transfer(
            &member,
            &env.current_contract_address(),
            &cfg.amount,
        );
        state.guarantee = cfg.amount;
        save_member(&env, &member, &state);
        bump(&env);
        env.events()
            .publish((symbol_short!("garantia"), member), cfg.amount);
    }

    pub fn withdraw_guarantee(env: Env, member: Address) -> i128 {
        member.require_auth();
        let cfg = config(&env);
        require_member(&env, &cfg, &member);
        if round(&env).index < cfg.members.len() {
            panic_with_error!(&env, Error::CircleNotFinished);
        }
        let mut state = member_state(&env, &member);
        let amount = state.guarantee;
        if amount == 0 {
            panic_with_error!(&env, Error::NoGuarantee);
        }
        state.guarantee = 0;
        save_member(&env, &member, &state);
        token::Client::new(&env, &cfg.token).transfer(
            &env.current_contract_address(),
            &member,
            &amount,
        );
        bump(&env);
        env.events()
            .publish((symbol_short!("devuelve"), member), amount);
        amount
    }

    pub fn bid(env: Env, member: Address, discount_bps: u32) {
        member.require_auth();
        let cfg = config(&env);
        let r = active_round(&env, &cfg);
        require_member(&env, &cfg, &member);
        if env.ledger().timestamp() > deadline(&cfg, r.index) {
            panic_with_error!(&env, Error::BidDeadlinePassed);
        }
        let state = member_state(&env, &member);
        if state.won {
            panic_with_error!(&env, Error::AlreadyWon);
        }
        if state.history.get(r.index).is_none() {
            panic_with_error!(&env, Error::NotContributed);
        }
        if discount_bps > MAX_BPS {
            panic_with_error!(&env, Error::BidTooHigh);
        }
        let mut bids = Self::bids(env.clone());
        let previous = bids.iter().enumerate().find(|(_, (who, _))| who == &member);
        let offer = (member.clone(), discount_bps);
        if let Some((index, (_, bps))) = previous {
            if discount_bps < bps {
                panic_with_error!(&env, Error::BidLower);
            }
            if discount_bps == bps {
                return;
            }
            bids.set(index as u32, offer);
        } else {
            bids.push_back(offer);
        }
        let store = env.storage().persistent();
        store.set(&Key::Bids, &bids);
        store.extend_ttl(&Key::Bids, BUMP_THRESHOLD, BUMP_TO);
        bump(&env);
        env.events()
            .publish((symbol_short!("puja"), member), (r.index, discount_bps));
    }

    pub fn settle(env: Env) -> Address {
        let cfg = config(&env);
        let r = active_round(&env, &cfg);
        if r.paid < cfg.members.len() && env.ledger().timestamp() <= deadline(&cfg, r.index) {
            panic_with_error!(&env, Error::RoundStillOpen);
        }
        let (winner, bps) = candidate(&env, &cfg).unwrap();
        let mut others: Vec<Address> = Vec::new(&env);
        let mut pot = r.carry + cfg.amount * i128::from(r.paid);
        for address in cfg.members.iter() {
            let mut state = member_state(&env, &address);
            if state.history.get(r.index).is_some() {
                if address != winner {
                    others.push_back(address.clone());
                }
            } else if state.guarantee >= cfg.amount {
                state.guarantee -= cfg.amount;
                state.history.push_back(COVERED);
                pot += cfg.amount;
                env.events().publish(
                    (symbol_short!("cubre"), address.clone()),
                    (r.index, cfg.amount),
                );
            } else {
                state.history.push_back(MISSED);
            }
            state.won |= address == winner;
            save_member(&env, &address, &state);
        }

        let discount = discount_amount(pot, bps);
        let count = i128::from(others.len());
        let share = discount.checked_div(count).unwrap_or(0);
        let carry = discount - share * count;
        let payout = pot - discount;
        let token = token::Client::new(&env, &cfg.token);
        let escrow = env.current_contract_address();
        if payout > 0 {
            token.transfer(&escrow, &winner, &payout);
        }
        if share > 0 {
            for other in others.iter() {
                token.transfer(&escrow, &other, &share);
            }
        }
        let store = env.storage().persistent();
        if store.has(&Key::Bids) {
            store.remove(&Key::Bids);
        }
        env.storage().instance().set(
            &Key::Round,
            &Round {
                index: r.index + 1,
                paid: 0,
                carry,
            },
        );
        bump(&env);
        env.events().publish(
            (symbol_short!("remate"), winner.clone()),
            (r.index, pot, discount),
        );
        winner
    }

    pub fn round_info(env: Env) -> RoundInfo {
        let cfg = config(&env);
        let r = round(&env);
        let mut covered = 0;
        let active = r.index < cfg.members.len();
        if active {
            for address in cfg.members.iter() {
                let state = member_state(&env, &address);
                if state.history.get(r.index).is_none() && state.guarantee >= cfg.amount {
                    covered += 1;
                }
            }
        }
        RoundInfo {
            round: r.index,
            deadline: if active { deadline(&cfg, r.index) } else { 0 },
            paid: r.paid,
            pot: r.carry + cfg.amount * i128::from(r.paid),
            carry: r.carry,
            covered,
            recipient: if active {
                candidate(&env, &cfg).map(|(who, _)| who)
            } else {
                None
            },
        }
    }

    pub fn members(env: Env) -> Vec<MemberInfo> {
        let cfg = config(&env);
        let r = round(&env);
        let mut members = Vec::new(&env);
        for address in cfg.members.iter() {
            let state = member_state(&env, &address);
            members.push_back(MemberInfo {
                address,
                paid: state.history.get(r.index).unwrap_or(0),
                guarantee: state.guarantee,
                won: state.won,
                score: score_of(&state.history),
                history: state.history,
            });
        }
        members
    }

    pub fn bids(env: Env) -> Vec<(Address, u32)> {
        env.storage()
            .persistent()
            .get(&Key::Bids)
            .unwrap_or_else(|| Vec::new(&env))
    }

    pub fn history(env: Env, member: Address) -> Vec<u32> {
        member_state(&env, &member).history
    }

    pub fn score(env: Env, member: Address) -> u32 {
        score_of(&Self::history(env, member))
    }

    pub fn version(_env: Env) -> u32 {
        1
    }
}

mod test;
