#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token, Address, Env, String, Vec};

const PERIOD: u64 = 30 * 24 * 60 * 60;
const BUMP_THRESHOLD: u32 = 10_000;
const BUMP_TO: u32 = 6_312_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1, NotMember = 2, InvalidConfig = 3, AlreadyContributed = 4,
    InvalidAmount = 5, InsufficientFund = 6, OpenRequestExists = 7, MissingRequest = 8,
    ClosedRequest = 9, CannotVote = 10, AlreadyVoted = 11, NothingToRepay = 12,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberInfo { pub contributed: i128, pub received: i128, pub repaid: i128, pub reputation: u32 }

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RequestInfo {
    pub id: u32, pub member: Address, pub amount: i128, pub reason: String,
    pub yes: u32, pub no: u32, pub resolved: bool, pub approved: bool,
}

#[contracttype]
#[derive(Clone)]
enum Key {
    Admin, Token, Members, Monthly, Quorum, MaxRequest, Fund, Reserved, Count,
    Member(Address), LastContribution(Address), OpenRequest(Address), Request(u32), Voted(u32, Address), Debt(Address),
}

fn bump(env: &Env) { env.storage().instance().extend_ttl(BUMP_THRESHOLD, BUMP_TO); }
fn touch(env: &Env, key: &Key) {
    if env.storage().persistent().has(key) { env.storage().persistent().extend_ttl(key, BUMP_THRESHOLD, BUMP_TO); }
}
fn get<T: soroban_sdk::TryFromVal<Env, soroban_sdk::Val>>(env: &Env, key: &Key, default: T) -> T {
    let value = env.storage().persistent().get(key).unwrap_or(default); touch(env, key); value
}
fn members(env: &Env) -> Vec<Address> { env.storage().instance().get(&Key::Members).unwrap() }
fn require_member(env: &Env, member: &Address) { if !members(env).contains(member) { panic_with_error!(env, Error::NotMember); } }
fn request(env: &Env, id: u32) -> RequestInfo {
    let key = Key::Request(id);
    let value = env.storage().persistent().get(&key).unwrap_or_else(|| panic_with_error!(env, Error::MissingRequest));
    touch(env, &key); value
}
fn save_request(env: &Env, item: &RequestInfo) { let key = Key::Request(item.id); env.storage().persistent().set(&key, item); touch(env, &key); }
fn member_info(env: &Env, member: &Address) -> MemberInfo {
    get(env, &Key::Member(member.clone()), MemberInfo { contributed: 0, received: 0, repaid: 0, reputation: 0 })
}
fn save_member(env: &Env, member: &Address, info: &MemberInfo) { let key = Key::Member(member.clone()); env.storage().persistent().set(&key, info); touch(env, &key); }

#[contract]
pub struct Ayni;

#[contractimpl]
impl Ayni {
    pub fn __constructor(env: Env, admin: Address, token_id: Address, members: Vec<Address>, monthly: i128, quorum_bps: u32, max_request: i128) {
        if members.len() < 2 || members.len() > 100 || monthly <= 0 || max_request <= 0 || quorum_bps == 0 || quorum_bps > 10_000 { panic_with_error!(&env, Error::InvalidConfig); }
        let mut seen = Vec::new(&env);
        for m in members.iter() { if seen.contains(m.clone()) { panic_with_error!(&env, Error::InvalidConfig); } seen.push_back(m); }
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::Token, &token_id);
        env.storage().instance().set(&Key::Members, &members);
        env.storage().instance().set(&Key::Monthly, &monthly);
        env.storage().instance().set(&Key::Quorum, &quorum_bps);
        env.storage().instance().set(&Key::MaxRequest, &max_request);
        env.storage().instance().set(&Key::Fund, &0i128);
        env.storage().instance().set(&Key::Reserved, &0i128);
        env.storage().instance().set(&Key::Count, &0u32);
        bump(&env);
        #[allow(deprecated)]
        env.events().publish((symbol_short!("inicio"), admin), (members.len(), monthly, quorum_bps, max_request));
    }

    pub fn contribute(env: Env, member: Address) {
        member.require_auth(); require_member(&env, &member);
        let last: u64 = env.storage().persistent().get(&Key::LastContribution(member.clone())).unwrap_or(u64::MAX);
        if last != u64::MAX && env.ledger().timestamp() < last + PERIOD { panic_with_error!(&env, Error::AlreadyContributed); }
        let monthly: i128 = env.storage().instance().get(&Key::Monthly).unwrap();
        let token_id: Address = env.storage().instance().get(&Key::Token).unwrap();
        token::Client::new(&env, &token_id).transfer(&member, &env.current_contract_address(), &monthly);
        let total: i128 = env.storage().instance().get(&Key::Fund).unwrap_or(0);
        env.storage().instance().set(&Key::Fund, &(total + monthly));
        let info = member_info(&env, &member);
        save_member(&env, &member, &MemberInfo { contributed: info.contributed + monthly, ..info });
        let key = Key::LastContribution(member.clone()); env.storage().persistent().set(&key, &env.ledger().timestamp()); touch(&env, &key); bump(&env);
        #[allow(deprecated)]
        env.events().publish((symbol_short!("aporte"), member), monthly);
    }

    pub fn request(env: Env, member: Address, amount: i128, reason: String) -> u32 {
        member.require_auth(); require_member(&env, &member);
        let max: i128 = env.storage().instance().get(&Key::MaxRequest).unwrap();
        let fund: i128 = env.storage().instance().get(&Key::Fund).unwrap_or(0);
        let reserved: i128 = env.storage().instance().get(&Key::Reserved).unwrap_or(0);
        if amount <= 0 || amount > max { panic_with_error!(&env, Error::InvalidAmount); }
        if amount > fund - reserved { panic_with_error!(&env, Error::InsufficientFund); }
        if env.storage().persistent().has(&Key::OpenRequest(member.clone())) { panic_with_error!(&env, Error::OpenRequestExists); }
        let id: u32 = env.storage().instance().get(&Key::Count).unwrap_or(0);
        let item = RequestInfo { id, member: member.clone(), amount, reason, yes: 0, no: 0, resolved: false, approved: false };
        save_request(&env, &item); env.storage().instance().set(&Key::Count, &(id + 1));
        env.storage().instance().set(&Key::Reserved, &(reserved + amount));
        let key = Key::OpenRequest(member.clone()); env.storage().persistent().set(&key, &id); touch(&env, &key); bump(&env);
        #[allow(deprecated)]
        env.events().publish((symbol_short!("pedido"), member), (id, amount));
        id
    }

    pub fn vote(env: Env, voter: Address, request_id: u32, approve: bool) {
        voter.require_auth(); require_member(&env, &voter);
        let mut item = request(&env, request_id);
        if item.resolved { panic_with_error!(&env, Error::ClosedRequest); }
        if item.member == voter { panic_with_error!(&env, Error::CannotVote); }
        let key = Key::Voted(request_id, voter.clone());
        if env.storage().persistent().has(&key) { panic_with_error!(&env, Error::AlreadyVoted); }
        env.storage().persistent().set(&key, &true); touch(&env, &key);
        if approve { item.yes += 1; } else { item.no += 1; }
        save_request(&env, &item); bump(&env);
        #[allow(deprecated)]
        env.events().publish((symbol_short!("voto"), voter), (request_id, approve));
    }

    /// Cierra el pedido cuando el resultado ya no puede cambiar; devuelve false si sigue abierto.
    pub fn resolve(env: Env, request_id: u32) -> bool {
        let mut item = request(&env, request_id);
        if item.resolved { panic_with_error!(&env, Error::ClosedRequest); }
        let eligible = members(&env).len() - 1;
        let quorum_bps: u32 = env.storage().instance().get(&Key::Quorum).unwrap();
        let needed = ((eligible * quorum_bps + 9_999) / 10_000).max(1);
        let approved = item.yes >= needed;
        let rejected = eligible - item.no < needed;
        if !approved && !rejected { return false; }
        let reserved: i128 = env.storage().instance().get(&Key::Reserved).unwrap_or(0);
        env.storage().instance().set(&Key::Reserved, &(reserved - item.amount));
        item.resolved = true; item.approved = approved;
        if approved {
            let fund: i128 = env.storage().instance().get(&Key::Fund).unwrap_or(0);
            if item.amount > fund { panic_with_error!(&env, Error::InsufficientFund); }
            env.storage().instance().set(&Key::Fund, &(fund - item.amount));
            let token_id: Address = env.storage().instance().get(&Key::Token).unwrap();
            token::Client::new(&env, &token_id).transfer(&env.current_contract_address(), &item.member, &item.amount);
            let info = member_info(&env, &item.member);
            save_member(&env, &item.member, &MemberInfo { received: info.received + item.amount, ..info });
            let key = Key::Debt(item.member.clone()); let debt: i128 = get(&env, &key, 0);
            env.storage().persistent().set(&key, &(debt + item.amount)); touch(&env, &key);
        }
        env.storage().persistent().remove(&Key::OpenRequest(item.member.clone()));
        save_request(&env, &item); bump(&env);
        #[allow(deprecated)]
        env.events().publish((symbol_short!("resuelve"), item.id), (approved, item.amount));
        true
    }

    pub fn repay(env: Env, member: Address, amount: i128) {
        member.require_auth(); require_member(&env, &member);
        if amount <= 0 { panic_with_error!(&env, Error::InvalidAmount); }
        let key = Key::Debt(member.clone()); let debt: i128 = get(&env, &key, 0);
        if amount > debt { panic_with_error!(&env, Error::NothingToRepay); }
        let token_id: Address = env.storage().instance().get(&Key::Token).unwrap();
        token::Client::new(&env, &token_id).transfer(&member, &env.current_contract_address(), &amount);
        let fund: i128 = env.storage().instance().get(&Key::Fund).unwrap_or(0);
        env.storage().instance().set(&Key::Fund, &(fund + amount));
        env.storage().persistent().set(&key, &(debt - amount)); touch(&env, &key);
        let info = member_info(&env, &member);
        save_member(&env, &member, &MemberInfo { repaid: info.repaid + amount, reputation: info.reputation.saturating_add(1), ..info });
        bump(&env);
        #[allow(deprecated)]
        env.events().publish((symbol_short!("devuelve"), member), amount);
    }

    pub fn fund(env: Env) -> i128 { bump(&env); env.storage().instance().get(&Key::Fund).unwrap_or(0) }
    pub fn requests(env: Env, start: u32, limit: u32) -> Vec<RequestInfo> {
        bump(&env); let count: u32 = env.storage().instance().get(&Key::Count).unwrap_or(0); let mut out = Vec::new(&env);
        let end = start.saturating_add(limit.min(50)).min(count);
        for id in start..end { out.push_back(request(&env, id)); }
        out
    }
    pub fn member(env: Env, m: Address) -> MemberInfo { require_member(&env, &m); bump(&env); member_info(&env, &m) }
    pub fn version(_env: Env) -> u32 { 1 }
}

mod test;
