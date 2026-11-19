//! Minka: fondo comunitario por hitos, con evidencia y aprobación colectiva.
#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, Map, String, Vec,
};

pub const VERSION: u32 = 1;
const MAX_MILESTONES: u32 = 32;
const MAX_VALIDATORS: u32 = 64;
const MAX_URI_BYTES: u32 = 512;
const DAY_LEDGERS: u32 = 17_280;
const BUMP_THRESHOLD: u32 = 30 * DAY_LEDGERS;
const BUMP_TO: u32 = 120 * DAY_LEDGERS;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidGoal = 1, InvalidMilestones = 2, InvalidDeadline = 3, InvalidValidators = 4,
    ProjectNotFound = 5, InvalidAmount = 6, ProjectClosed = 7, GoalReached = 8,
    NotOrganizer = 9, InvalidMilestone = 10, EvidenceRequired = 11, NotValidator = 12,
    AlreadyApproved = 13, OutOfOrder = 14, NothingToRefund = 15, RefundUnavailable = 16,
    AlreadyRefunded = 17, InvalidEvidence = 18, EvidenceLocked = 19,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Milestone { pub title: String, pub amount: i128 }

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct MilestoneInfo {
    pub title: String, pub amount: i128, pub evidence: Option<String>, pub approvals: u32, pub released: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ProjectInfo {
    pub organizer: Address, pub token: Address, pub title: String, pub goal: i128,
    pub raised: i128, pub released: i128, pub deadline: u64, pub canceled: bool,
    pub next_milestone: u32,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Info, Milestones, Validators, Contributions(Address), Refunded(Address),
    Evidence(u32), Approvals(u32), RefundedTotal, RefundedContributions,
}

#[contract]
pub struct Minka;

fn bump(env: &Env) { env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO); }
fn info(env: &Env) -> ProjectInfo {
    env.storage().instance().get(&Key::Info).unwrap_or_else(|| panic_with_error!(env, Error::ProjectNotFound))
}
fn contribution(env: &Env, backer: &Address) -> i128 {
    env.storage().persistent().get(&Key::Contributions(backer.clone())).unwrap_or(0)
}
fn write_contribution(env: &Env, backer: &Address, value: i128) {
    let key = Key::Contributions(backer.clone());
    env.storage().persistent().set(&key, &value);
    env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
}
fn milestone_list(env: &Env) -> Vec<Milestone> { env.storage().instance().get(&Key::Milestones).unwrap() }
fn ensure_milestone(env: &Env, number: u32, cfg: &ProjectInfo) {
    if number >= milestone_list(env).len() { panic_with_error!(env, Error::InvalidMilestone); }
    if number != cfg.next_milestone { panic_with_error!(env, Error::OutOfOrder); }
}

#[contractimpl]
impl Minka {
    /// Los montos de los hitos deben sumar exactamente la meta.
    pub fn __constructor(env: Env, organizer: Address, token: Address, title: String, goal: i128,
        milestones: Vec<Milestone>, deadline: u64, validators: Vec<Address>) {
        if goal <= 0 { panic_with_error!(&env, Error::InvalidGoal); }
        if milestones.is_empty() || milestones.len() > MAX_MILESTONES { panic_with_error!(&env, Error::InvalidMilestones); }
        let mut sum = 0i128;
        for m in milestones.iter() {
            if m.amount <= 0 { panic_with_error!(&env, Error::InvalidMilestones); }
            sum = sum.checked_add(m.amount).unwrap_or_else(|| panic_with_error!(&env, Error::InvalidMilestones));
        }
        if sum != goal { panic_with_error!(&env, Error::InvalidMilestones); }
        if deadline <= env.ledger().timestamp() { panic_with_error!(&env, Error::InvalidDeadline); }
        if validators.is_empty() || validators.len() > MAX_VALIDATORS { panic_with_error!(&env, Error::InvalidValidators); }
        for i in 0..validators.len() {
            let a = validators.get(i).unwrap();
            for j in 0..i { if validators.get(j).unwrap() == a { panic_with_error!(&env, Error::InvalidValidators); } }
        }
        env.storage().instance().set(&Key::Info, &ProjectInfo { organizer, token, title, goal, raised: 0, released: 0, deadline, canceled: false, next_milestone: 0 });
        env.storage().instance().set(&Key::Milestones, &milestones);
        env.storage().instance().set(&Key::Validators, &validators);
        bump(&env);
    }

    /// Aporta al fondo; no admite excedentes sobre la meta.
    pub fn fund(env: Env, backer: Address, amount: i128) {
        backer.require_auth();
        let mut cfg = info(&env);
        if cfg.canceled || env.ledger().timestamp() > cfg.deadline { panic_with_error!(&env, Error::ProjectClosed); }
        if amount <= 0 { panic_with_error!(&env, Error::InvalidAmount); }
        if cfg.raised >= cfg.goal { panic_with_error!(&env, Error::GoalReached); }
        let raised = cfg.raised.checked_add(amount).unwrap_or_else(|| panic_with_error!(&env, Error::InvalidAmount));
        if raised > cfg.goal { panic_with_error!(&env, Error::InvalidAmount); }
        token::Client::new(&env, &cfg.token).transfer(&backer, &env.current_contract_address(), &amount);
        write_contribution(&env, &backer, contribution(&env, &backer) + amount);
        cfg.raised = raised;
        env.storage().instance().set(&Key::Info, &cfg);
        bump(&env);
        #[allow(deprecated)] env.events().publish((symbol_short!("fund"), backer), amount);
    }

    pub fn submit_evidence(env: Env, organizer: Address, milestone: u32, uri: String) {
        organizer.require_auth();
        let cfg = info(&env);
        if organizer != cfg.organizer { panic_with_error!(&env, Error::NotOrganizer); }
        if cfg.canceled || cfg.raised < cfg.goal { panic_with_error!(&env, Error::ProjectClosed); }
        ensure_milestone(&env, milestone, &cfg);
        if uri.len() == 0 || uri.len() > MAX_URI_BYTES { panic_with_error!(&env, Error::InvalidEvidence); }
        let votes: Map<Address, bool> = env.storage().persistent().get(&Key::Approvals(milestone)).unwrap_or(Map::new(&env));
        if votes.len() > 0 { panic_with_error!(&env, Error::EvidenceLocked); }
        let key = Key::Evidence(milestone);
        env.storage().persistent().set(&key, &uri);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        bump(&env);
        #[allow(deprecated)] env.events().publish((symbol_short!("evid"), milestone), uri);
    }

    pub fn approve(env: Env, validator: Address, milestone: u32) {
        validator.require_auth();
        let validators: Vec<Address> = env.storage().instance().get(&Key::Validators).unwrap();
        if !validators.contains(validator.clone()) { panic_with_error!(&env, Error::NotValidator); }
        let mut cfg = info(&env);
        if cfg.canceled || cfg.raised < cfg.goal { panic_with_error!(&env, Error::ProjectClosed); }
        ensure_milestone(&env, milestone, &cfg);
        if !env.storage().persistent().has(&Key::Evidence(milestone)) { panic_with_error!(&env, Error::EvidenceRequired); }
        let key = Key::Approvals(milestone);
        let mut approvals: Map<Address, bool> = env.storage().persistent().get(&key).unwrap_or(Map::new(&env));
        if approvals.contains_key(validator.clone()) { panic_with_error!(&env, Error::AlreadyApproved); }
        approvals.set(validator.clone(), true);
        let count = approvals.len();
        env.storage().persistent().set(&key, &approvals);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        if count > validators.len() / 2 {
            let item = milestone_list(&env).get(milestone).unwrap();
            token::Client::new(&env, &cfg.token).transfer(&env.current_contract_address(), &cfg.organizer, &item.amount);
            cfg.released += item.amount;
            cfg.next_milestone += 1;
            env.storage().instance().set(&Key::Info, &cfg);
            #[allow(deprecated)] env.events().publish((symbol_short!("release"), milestone), (cfg.organizer.clone(), item.amount));
        } else {
            #[allow(deprecated)] env.events().publish((symbol_short!("vote"), milestone, validator), count);
        }
        bump(&env);
    }

    pub fn refund(env: Env, backer: Address) -> i128 {
        backer.require_auth();
        let cfg = info(&env);
        let expired_unfunded = env.ledger().timestamp() > cfg.deadline && cfg.raised < cfg.goal;
        if !cfg.canceled && !expired_unfunded { panic_with_error!(&env, Error::RefundUnavailable); }
        let amount = contribution(&env, &backer);
        if amount <= 0 { panic_with_error!(&env, Error::NothingToRefund); }
        let key = Key::Refunded(backer.clone());
        if env.storage().persistent().get::<_, bool>(&key).unwrap_or(false) { panic_with_error!(&env, Error::AlreadyRefunded); }
        let pool = cfg.raised - cfg.released;
        let refunded: i128 = env.storage().instance().get(&Key::RefundedTotal).unwrap_or(0);
        let refunded_contributions: i128 = env.storage().instance().get(&Key::RefundedContributions).unwrap_or(0);
        let mut value = amount.checked_mul(pool).unwrap_or_else(|| panic_with_error!(&env, Error::InvalidAmount)) / cfg.raised;
        if refunded_contributions + amount == cfg.raised { value = pool - refunded; }
        env.storage().persistent().set(&key, &true);
        env.storage().persistent().extend_ttl(&key, BUMP_THRESHOLD, BUMP_TO);
        env.storage().instance().set(&Key::RefundedTotal, &(refunded + value));
        env.storage().instance().set(&Key::RefundedContributions, &(refunded_contributions + amount));
        if value > 0 { token::Client::new(&env, &cfg.token).transfer(&env.current_contract_address(), &backer, &value); }
        bump(&env);
        #[allow(deprecated)] env.events().publish((symbol_short!("refund"), backer), value);
        value
    }

    pub fn cancel(env: Env, organizer: Address) {
        organizer.require_auth();
        let mut cfg = info(&env);
        if organizer != cfg.organizer { panic_with_error!(&env, Error::NotOrganizer); }
        if cfg.canceled || cfg.next_milestone >= milestone_list(&env).len() { panic_with_error!(&env, Error::ProjectClosed); }
        cfg.canceled = true;
        env.storage().instance().set(&Key::Info, &cfg);
        bump(&env);
        #[allow(deprecated)] env.events().publish((symbol_short!("cancel"), organizer), cfg.released);
    }

    pub fn info(env: Env) -> ProjectInfo { info(&env) }
    pub fn milestones(env: Env) -> Vec<MilestoneInfo> {
        let cfg = info(&env);
        let source = milestone_list(&env);
        let mut out = Vec::new(&env);
        for i in 0..source.len() {
            let item = source.get(i).unwrap();
            let approvals: Map<Address, bool> = env.storage().persistent().get(&Key::Approvals(i)).unwrap_or(Map::new(&env));
            out.push_back(MilestoneInfo { title: item.title, amount: item.amount,
                evidence: env.storage().persistent().get(&Key::Evidence(i)), approvals: approvals.len(), released: i < cfg.next_milestone });
        }
        out
    }
    pub fn backer(env: Env, addr: Address) -> i128 { contribution(&env, &addr) }
    pub fn version(_env: Env) -> u32 { VERSION }
}

mod test;
