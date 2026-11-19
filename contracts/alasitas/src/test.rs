#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, vec, Address, Env};

const UNIT: i128 = 10_000_000;
const WEEK: u64 = 7 * 24 * 60 * 60;

fn code(error: Error) -> soroban_sdk::Error {
    soroban_sdk::Error::from_contract_error(error as u32)
}

struct Setup<'a> {
    env: Env,
    owner: Address,
    members: [Address; 3],
    token: token::Client<'a>,
    contract: AlasitasClient<'a>,
    goal_id: u32,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000_000);
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token = token::Client::new(&env, &sac.address());
    let minter = token::StellarAssetClient::new(&env, &sac.address());
    let members = [Address::generate(&env), Address::generate(&env), Address::generate(&env)];
    for member in &members { minter.mint(member, &(100 * UNIT)); }
    let id = env.register(Alasitas, ());
    let contract = AlasitasClient::new(&env, &id);
    let goal_id = contract.create_goal(
        &members[0], &sac.address(), &soroban_sdk::String::from_str(&env, "Mi casita"),
        &Symbol::new(&env, "casa"), &(100 * UNIT), &(1_500_000u64),
        &vec![&env, members[0].clone(), members[1].clone(), members[2].clone()],
    );
    Setup { env, owner: members[0].clone(), members, token, contract, goal_id }
}

#[test]
fn create_deposit_and_views_report_goal_progress() {
    let s = setup();
    assert_eq!(s.goal_id, 0);
    s.contract.deposit(&s.members[0], &s.goal_id, &(30 * UNIT));
    s.contract.deposit(&s.members[1], &s.goal_id, &(20 * UNIT));
    assert_eq!(s.contract.progress(&s.goal_id), (50 * UNIT, 100 * UNIT));
    assert_eq!(s.contract.goal(&s.goal_id).saved, 50 * UNIT);
    assert_eq!(s.contract.goals_of(&s.owner).len(), 1);
    assert_eq!(s.contract.version(), VERSION);
    assert_eq!(s.token.balance(&s.members[0]), 70 * UNIT);
}

#[test]
fn only_members_can_deposit_and_non_owner_cannot_withdraw() {
    let s = setup();
    let outsider = Address::generate(&s.env);
    let result = s.contract.try_deposit(&outsider, &s.goal_id, &UNIT);
    assert_eq!(result.unwrap_err().unwrap(), code(Error::NotMember));
    s.contract.deposit(&s.members[1], &s.goal_id, &(12 * UNIT));
    let result = s.contract.try_withdraw(&s.members[1], &s.goal_id);
    assert_eq!(result.unwrap_err().unwrap(), code(Error::NotMember));
}

#[test]
fn target_unlock_distributes_only_each_members_contributions_once() {
    let s = setup();
    s.contract.deposit(&s.members[0], &s.goal_id, &(60 * UNIT));
    s.contract.deposit(&s.members[1], &s.goal_id, &(40 * UNIT));
    assert_eq!(s.contract.withdraw(&s.owner, &s.goal_id), 100 * UNIT);
    assert_eq!(s.token.balance(&s.members[0]), 100 * UNIT);
    assert_eq!(s.token.balance(&s.members[1]), 100 * UNIT);
    assert!(s.contract.goal(&s.goal_id).closed);
    let result = s.contract.try_withdraw(&s.owner, &s.goal_id);
    assert_eq!(result.unwrap_err().unwrap(), code(Error::AlreadyClosed));
}

#[test]
fn withdraw_is_allowed_at_unlock_even_if_target_was_not_reached() {
    let s = setup();
    s.contract.deposit(&s.members[1], &s.goal_id, &(10 * UNIT));
    let result = s.contract.try_withdraw(&s.owner, &s.goal_id);
    assert_eq!(result.unwrap_err().unwrap(), code(Error::GoalLocked));
    s.env.ledger().with_mut(|ledger| ledger.timestamp = 1_500_000);
    assert_eq!(s.contract.withdraw(&s.owner, &s.goal_id), 10 * UNIT);
    assert_eq!(s.token.balance(&s.members[1]), 100 * UNIT);
}

#[test]
fn early_exit_returns_own_deposit_reduces_progress_and_records_exit() {
    let s = setup();
    s.contract.deposit(&s.members[0], &s.goal_id, &(10 * UNIT));
    s.contract.deposit(&s.members[1], &s.goal_id, &(20 * UNIT));
    assert_eq!(s.contract.early_exit(&s.members[1], &s.goal_id), 20 * UNIT);
    assert_eq!(s.contract.progress(&s.goal_id), (10 * UNIT, 100 * UNIT));
    assert_eq!(s.token.balance(&s.members[1]), 100 * UNIT);
    let result = s.contract.try_early_exit(&s.members[1], &s.goal_id);
    assert_eq!(result.unwrap_err().unwrap(), code(Error::NothingToWithdraw));
    assert_eq!(s.contract.exit_history(&s.members[1], &s.goal_id), vec![&s.env, 1_000_000]);
    s.env.ledger().with_mut(|ledger| ledger.timestamp = 1_500_000);
    assert_eq!(s.contract.withdraw(&s.owner, &s.goal_id), 10 * UNIT);
}

#[test]
fn streak_counts_consecutive_weeks_and_resets_after_a_gap() {
    let s = setup();
    s.contract.deposit(&s.members[0], &s.goal_id, &UNIT);
    s.contract.deposit(&s.members[0], &s.goal_id, &UNIT);
    assert_eq!(s.contract.streak(&s.members[0], &s.goal_id), 1);
    s.env.ledger().with_mut(|ledger| ledger.timestamp += WEEK);
    s.contract.deposit(&s.members[0], &s.goal_id, &UNIT);
    assert_eq!(s.contract.streak(&s.members[0], &s.goal_id), 2);
    s.env.ledger().with_mut(|ledger| ledger.timestamp += WEEK * 2);
    s.contract.deposit(&s.members[0], &s.goal_id, &UNIT);
    assert_eq!(s.contract.streak(&s.members[0], &s.goal_id), 1);
}

#[test]
fn invalid_goals_and_nonpositive_deposits_are_rejected() {
    let s = setup();
    let result = s.contract.try_deposit(&s.members[0], &s.goal_id, &0);
    assert_eq!(result.unwrap_err().unwrap(), code(Error::InvalidAmount));
    let result = s.contract.try_create_goal(
        &s.members[0], &s.contract.goal(&s.goal_id).token,
        &soroban_sdk::String::from_str(&s.env, "invalida"), &Symbol::new(&s.env, "juego"),
        &(10 * UNIT), &2_000_000, &vec![&s.env, s.members[0].clone()],
    );
    assert_eq!(result.unwrap_err().unwrap(), code(Error::InvalidKind));
    let result = s.contract.try_create_goal(
        &s.members[0], &s.contract.goal(&s.goal_id).token,
        &soroban_sdk::String::from_str(&s.env, "sin titular"), &Symbol::new(&s.env, "casa"),
        &(10 * UNIT), &2_000_000, &vec![&s.env, s.members[1].clone()],
    );
    assert_eq!(result.unwrap_err().unwrap(), code(Error::OwnerNotMember));
}
