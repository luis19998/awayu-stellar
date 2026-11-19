//! Metas de ahorro inspiradas en las miniaturas de la feria de Alasitas.
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, String, Symbol, Vec,
};

pub const VERSION: u32 = 1;
const WEEK: u64 = 7 * 24 * 60 * 60;
const MAX_TITLE: u32 = 80;
const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidTarget = 1,
    InvalidTitle = 2,
    InvalidKind = 3,
    OwnerNotMember = 4,
    DuplicateMember = 5,
    NotMember = 6,
    NothingToWithdraw = 7,
    GoalLocked = 8,
    AlreadyClosed = 9,
    Overflow = 10,
    InvalidAmount = 11,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Goal {
    pub id: u32,
    pub owner: Address,
    pub token: Address,
    pub title: String,
    pub kind: Symbol,
    pub target: i128,
    pub unlock_at: u64,
    pub members: Vec<Address>,
    pub saved: i128,
    pub closed: bool,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Count,
    Goal(u32),
    Contribution(u32, Address),
    Streak(u32, Address),
    ExitHistory(u32, Address),
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
struct StreakInfo {
    last_week: u64,
    count: u32,
}

#[contract]
pub struct Alasitas;

fn bump(env: &Env) {
    env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO);
}

fn read_goal(env: &Env, id: u32) -> Goal {
    let key = Key::Goal(id);
    let goal: Goal = env.storage().persistent().get(&key).unwrap();
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
    goal
}

fn write_goal(env: &Env, goal: &Goal) {
    let key = Key::Goal(goal.id);
    env.storage().persistent().set(&key, goal);
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}

fn contribution(env: &Env, id: u32, member: &Address) -> i128 {
    env.storage().persistent().get(&Key::Contribution(id, member.clone())).unwrap_or(0)
}

fn set_contribution(env: &Env, id: u32, member: &Address, amount: i128) {
    let key = Key::Contribution(id, member.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}

fn require_member(env: &Env, goal: &Goal, member: &Address) {
    if !goal.members.contains(member) {
        panic_with_error!(env, Error::NotMember);
    }
}

fn valid_kind(kind: &Symbol) -> bool {
    *kind == symbol_short!("casa")
        || *kind == symbol_short!("auto")
        || *kind == symbol_short!("estudio")
        || *kind == symbol_short!("negocio")
        || *kind == symbol_short!("viaje")
        || *kind == symbol_short!("salud")
        || *kind == symbol_short!("otro")
}

#[allow(deprecated)]
#[contractimpl]
impl Alasitas {
    /// Crea una meta. El titular debe figurar entre las personas participantes.
    pub fn create_goal(
        env: Env,
        owner: Address,
        token: Address,
        title: String,
        kind: Symbol,
        target: i128,
        unlock_at: u64,
        members: Vec<Address>,
    ) -> u32 {
        owner.require_auth();
        if target <= 0 { panic_with_error!(&env, Error::InvalidTarget); }
        if title.len() == 0 || title.len() > MAX_TITLE { panic_with_error!(&env, Error::InvalidTitle); }
        if !valid_kind(&kind) { panic_with_error!(&env, Error::InvalidKind); }
        if !members.contains(&owner) { panic_with_error!(&env, Error::OwnerNotMember); }
        for (i, member) in members.iter().enumerate() {
            if members.iter().skip(i + 1).any(|other| other == member) {
                panic_with_error!(&env, Error::DuplicateMember);
            }
        }
        let id: u32 = env.storage().instance().get(&Key::Count).unwrap_or(0);
        let next = id.checked_add(1).unwrap_or_else(|| panic_with_error!(&env, Error::Overflow));
        let goal = Goal {
            id, owner: owner.clone(), token, title, kind, target, unlock_at,
            members, saved: 0, closed: false,
        };
        write_goal(&env, &goal);
        env.storage().instance().set(&Key::Count, &next);
        bump(&env);
        env.events().publish((symbol_short!("crea"), owner), (id, goal.target, goal.unlock_at));
        id
    }

    /// Aporta al ahorro de una meta; solo pueden participar sus miembros.
    pub fn deposit(env: Env, from: Address, goal_id: u32, amount: i128) -> i128 {
        from.require_auth();
        if amount <= 0 { panic_with_error!(&env, Error::InvalidAmount); }
        let mut goal = read_goal(&env, goal_id);
        require_member(&env, &goal, &from);
        if goal.closed { panic_with_error!(&env, Error::AlreadyClosed); }
        let updated = goal.saved.checked_add(amount).unwrap_or_else(|| panic_with_error!(&env, Error::Overflow));
        let prior = contribution(&env, goal_id, &from);
        let personal = prior.checked_add(amount).unwrap_or_else(|| panic_with_error!(&env, Error::Overflow));
        token::Client::new(&env, &goal.token).transfer(&from, &env.current_contract_address(), &amount);
        goal.saved = updated;
        set_contribution(&env, goal_id, &from, personal);

        let week = env.ledger().timestamp() / WEEK;
        let key = Key::Streak(goal_id, from.clone());
        let mut streak: StreakInfo = env.storage().persistent().get(&key).unwrap_or(StreakInfo { last_week: u64::MAX, count: 0 });
        if streak.last_week != week {
            streak.count = if streak.last_week != u64::MAX && streak.last_week + 1 == week {
                streak.count.saturating_add(1)
            } else { 1 };
            streak.last_week = week;
        }
        env.storage().persistent().set(&key, &streak);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        write_goal(&env, &goal);
        bump(&env);
        env.events().publish((symbol_short!("aporte"), from), (goal_id, amount, goal.saved));
        goal.saved
    }

    /// Devuelve a cada miembro su saldo aportado cuando se alcanza la meta o vence el plazo.
    pub fn withdraw(env: Env, owner: Address, goal_id: u32) -> i128 {
        owner.require_auth();
        let mut goal = read_goal(&env, goal_id);
        if owner != goal.owner { panic_with_error!(&env, Error::NotMember); }
        if goal.closed { panic_with_error!(&env, Error::AlreadyClosed); }
        if goal.saved < goal.target && env.ledger().timestamp() < goal.unlock_at {
            panic_with_error!(&env, Error::GoalLocked);
        }
        let total = goal.saved;
        for member in goal.members.iter() {
            let amount = contribution(&env, goal_id, &member);
            if amount > 0 {
                set_contribution(&env, goal_id, &member, 0);
                token::Client::new(&env, &goal.token).transfer(&env.current_contract_address(), &member, &amount);
            }
        }
        goal.saved = 0;
        goal.closed = true;
        write_goal(&env, &goal);
        bump(&env);
        env.events().publish((symbol_short!("retira"), owner), (goal_id, total));
        total
    }

    /// Retira el aporte propio antes del desbloqueo y registra la salida sin multa.
    pub fn early_exit(env: Env, member: Address, goal_id: u32) -> i128 {
        member.require_auth();
        let mut goal = read_goal(&env, goal_id);
        require_member(&env, &goal, &member);
        if goal.closed { panic_with_error!(&env, Error::AlreadyClosed); }
        if goal.saved >= goal.target || env.ledger().timestamp() >= goal.unlock_at {
            panic_with_error!(&env, Error::GoalLocked);
        }
        let amount = contribution(&env, goal_id, &member);
        if amount <= 0 { panic_with_error!(&env, Error::NothingToWithdraw); }
        set_contribution(&env, goal_id, &member, 0);
        goal.saved -= amount;
        write_goal(&env, &goal);
        let key = Key::ExitHistory(goal_id, member.clone());
        let mut exits: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        exits.push_back(env.ledger().timestamp());
        env.storage().persistent().set(&key, &exits);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        token::Client::new(&env, &goal.token).transfer(&env.current_contract_address(), &member, &amount);
        bump(&env);
        env.events().publish((symbol_short!("sale"), member), (goal_id, amount));
        amount
    }

    pub fn goal(env: Env, id: u32) -> Goal { bump(&env); read_goal(&env, id) }

    pub fn goals_of(env: Env, owner: Address) -> Vec<Goal> {
        let count: u32 = env.storage().instance().get(&Key::Count).unwrap_or(0);
        let mut out = Vec::new(&env);
        for id in 0..count {
            if let Some(goal) = env.storage().persistent().get::<Key, Goal>(&Key::Goal(id)) {
                if goal.owner == owner {
                    env.storage().persistent().extend_ttl(&Key::Goal(id), BUMP_THRESHOLD, BUMP_TO);
                    out.push_back(goal);
                }
            }
        }
        bump(&env);
        out
    }

    pub fn progress(env: Env, id: u32) -> (i128, i128) {
        let goal = read_goal(&env, id); bump(&env); (goal.saved, goal.target)
    }

    pub fn streak(env: Env, member: Address, goal_id: u32) -> u32 {
        let key = Key::Streak(goal_id, member);
        let result = env.storage().persistent().get::<Key, StreakInfo>(&key).map(|s| s.count).unwrap_or(0);
        if env.storage().persistent().has(&key) { env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO); }
        bump(&env);
        result
    }

    /// Fechas públicas en las que una persona retiró su parte antes del plazo.
    pub fn exit_history(env: Env, member: Address, goal_id: u32) -> Vec<u64> {
        let key = Key::ExitHistory(goal_id, member);
        let exits = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        if env.storage().persistent().has(&key) {
            env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        }
        bump(&env);
        exits
    }

    pub fn version(_env: Env) -> u32 { VERSION }
}

mod test;
