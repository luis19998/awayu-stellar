#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, vec, Address, Env, String};

fn code(error: Error) -> soroban_sdk::Error {
    soroban_sdk::Error::from_contract_error(error as u32)
}

struct Setup<'a> {
    env: Env,
    organizer: Address,
    validators: [Address; 3],
    backers: [Address; 2],
    token: token::Client<'a>,
    project: MinkaClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token = token::Client::new(&env, &sac.address());
    let minter = token::StellarAssetClient::new(&env, &sac.address());
    let organizer = Address::generate(&env);
    let validators = [Address::generate(&env), Address::generate(&env), Address::generate(&env)];
    let backers = [Address::generate(&env), Address::generate(&env)];
    for b in backers.iter() { minter.mint(b, &1_000); }
    let milestones = vec![
        &env,
        Milestone { title: String::from_str(&env, "Canal"), amount: 400 },
        Milestone { title: String::from_str(&env, "Reservorio"), amount: 600 },
    ];
    let validator_list = vec![&env, validators[0].clone(), validators[1].clone(), validators[2].clone()];
    let id = env.register(Minka, (
        organizer.clone(), sac.address(), String::from_str(&env, "Riego comunitario"),
        1_000i128, milestones, 2_000u64, validator_list,
    ));
    let project = MinkaClient::new(&env, &id);
    Setup { env, organizer, validators, backers, token, project }
}

fn fill(s: &Setup) {
    s.project.fund(&s.backers[0], &400);
    s.project.fund(&s.backers[1], &600);
}

#[test]
fn constructor_y_lecturas_exponen_proyecto_y_hitos() {
    let s = setup();
    let info = s.project.info();
    assert_eq!(info.goal, 1_000);
    assert_eq!(info.raised, 0);
    assert_eq!(info.next_milestone, 0);
    assert_eq!(s.project.milestones().len(), 2);
    assert_eq!(s.project.version(), VERSION);
}

#[test]
fn financiamiento_no_puede_superar_meta_y_guarda_saldo_por_aportante() {
    let s = setup();
    s.project.fund(&s.backers[0], &400);
    assert_eq!(s.project.backer(&s.backers[0]), 400);
    let err = s.project.try_fund(&s.backers[1], &601).unwrap_err().unwrap();
    assert_eq!(err, code(Error::InvalidAmount));
    s.project.fund(&s.backers[1], &600);
    assert_eq!(s.project.info().raised, 1_000);
}

#[test]
fn evidencia_mayoria_simple_y_hitos_en_orden_liberan_fondos() {
    let s = setup();
    fill(&s);
    let r = s.project.try_approve(&s.validators[0], &0).unwrap_err().unwrap();
    assert_eq!(r, code(Error::EvidenceRequired));
    s.project.submit_evidence(&s.organizer, &0, &String::from_str(&s.env, "ipfs://foto-canal"));
    s.project.approve(&s.validators[0], &0);
    assert_eq!(s.project.info().released, 0);
    s.project.approve(&s.validators[1], &0);
    assert_eq!(s.project.info().released, 400);
    assert_eq!(s.token.balance(&s.organizer), 400);
    assert!(s.project.milestones().get(0).unwrap().released);
    // Después del hito 0 corresponde el 1: subir evidencia del 2 está fuera de orden
    let r = s.project.try_submit_evidence(&s.organizer, &2, &String::from_str(&s.env, "ipfs://antes")).unwrap_err().unwrap();
    assert_eq!(r, code(Error::OutOfOrder));
}

#[test]
fn vencimiento_devuelve_aportes_proporcionales_incluyendo_redondeo() {
    let s = setup();
    s.project.fund(&s.backers[0], &1);
    s.project.fund(&s.backers[1], &2);
    s.env.ledger().with_mut(|l| l.timestamp = 2_001);
    assert_eq!(s.project.refund(&s.backers[0]), 1);
    assert_eq!(s.project.refund(&s.backers[1]), 2);
    assert_eq!(s.token.balance(&s.backers[0]), 1_000);
    assert_eq!(s.token.balance(&s.backers[1]), 1_000);
    let r = s.project.try_refund(&s.backers[0]).unwrap_err().unwrap();
    assert_eq!(r, code(Error::AlreadyRefunded));
}

#[test]
fn cancelacion_reembolsa_solo_lo_no_liberado_y_rechaza_no_validador() {
    let s = setup();
    fill(&s);
    s.project.submit_evidence(&s.organizer, &0, &String::from_str(&s.env, "ipfs://canal"));
    s.project.approve(&s.validators[0], &0);
    s.project.approve(&s.validators[1], &0);
    let outsider = Address::generate(&s.env);
    let r = s.project.try_approve(&outsider, &1).unwrap_err().unwrap();
    assert_eq!(r, code(Error::NotValidator));
    s.project.cancel(&s.organizer);
    assert_eq!(s.project.refund(&s.backers[0]), 240);
    assert_eq!(s.project.refund(&s.backers[1]), 360);
    assert_eq!(s.token.balance(&s.organizer), 400);
}

