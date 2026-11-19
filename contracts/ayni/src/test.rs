use crate::{Ayni, AyniClient, Error, MemberInfo, RequestInfo};
use soroban_sdk::{testutils::Address as _, token, vec, Address, Env, String};

fn code(e: Error) -> soroban_sdk::Error { soroban_sdk::Error::from_contract_error(e as u32) }
const UNIT: i128 = 1_000_000;

struct Setup<'a> { env: Env, members: [Address; 4], token: token::Client<'a>, ayni: AyniClient<'a> }
fn setup<'a>() -> Setup<'a> {
    let env = Env::default(); env.mock_all_auths(); env.ledger().with_mut(|l| l.timestamp = 1_000);
    let admin = Address::generate(&env); let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::Client::new(&env, &sac.address()); let minter = token::StellarAssetClient::new(&env, &sac.address());
    let members = [Address::generate(&env), Address::generate(&env), Address::generate(&env), Address::generate(&env)];
    for m in &members { minter.mint(m, &(20 * UNIT)); }
    let id = env.register(Ayni, (admin, sac.address(), vec![&env, members[0].clone(), members[1].clone(), members[2].clone(), members[3].clone()], UNIT, 5_000u32, 5 * UNIT));
    let ayni = AyniClient::new(&env, &id);
    Setup { env, members, token, ayni }
}

#[test]
fn aporta_una_vez_cada_periodo_de_30_dias() {
    let s = setup(); let m = &s.members[0];
    s.ayni.contribute(m);
    assert_eq!(s.ayni.fund(), UNIT);
    assert_eq!(s.ayni.member(m), MemberInfo { contributed: UNIT, received: 0, repaid: 0, reputation: 0 });
    assert_eq!(s.ayni.try_contribute(m).unwrap_err().unwrap(), code(Error::AlreadyContributed));
    s.env.ledger().with_mut(|l| l.timestamp += 30 * 24 * 60 * 60);
    s.ayni.contribute(m); assert_eq!(s.ayni.fund(), 2 * UNIT);
}

#[test]
fn pedido_no_supera_saldo_disponible() {
    let s = setup(); let m = &s.members[0];
    let err = s.ayni.try_request(m, &(1), &String::from_str(&s.env, "emergencia")).unwrap_err().unwrap();
    assert_eq!(err, code(Error::InsufficientFund));
}

#[test]
fn votacion_alcanza_quorum_y_se_paga() {
    let s = setup(); let [a,b,c,d] = &s.members;
    for m in &s.members { s.ayni.contribute(m); }
    let id = s.ayni.request(a, &(2 * UNIT), &String::from_str(&s.env, "salud"));
    s.ayni.vote(b, &id, &true); s.ayni.vote(c, &id, &true);
    assert!(s.ayni.resolve(&id));
    assert_eq!(s.token.balance(a), 21 * UNIT);
    assert_eq!(s.ayni.fund(), 2 * UNIT);
    assert_eq!(s.ayni.member(a).received, 2 * UNIT);
    assert_eq!(s.ayni.requests(&0, &10).get(0).unwrap(), RequestInfo { id, member: a.clone(), amount: 2 * UNIT, reason: String::from_str(&s.env, "salud"), yes: 2, no: 0, resolved: true, approved: true });
    let _ = d;
}

#[test]
fn voto_duplicado_y_rechazo_por_quorum_imposible() {
    let s = setup(); let [a,b,c,d] = &s.members;
    for m in &s.members { s.ayni.contribute(m); }
    let id = s.ayni.request(a, &(UNIT), &String::from_str(&s.env, "urgencia"));
    s.ayni.vote(b, &id, &false);
    assert_eq!(s.ayni.try_vote(b, &id, &false).unwrap_err().unwrap(), code(Error::AlreadyVoted));
    s.ayni.vote(c, &id, &false);
    assert!(s.ayni.resolve(&id));
    let item = s.ayni.requests(&0, &10).get(0).unwrap(); assert!(item.resolved); assert!(!item.approved);
    let _ = d;
}

#[test]
fn devuelve_sin_intereses_y_suma_reputacion() {
    let s = setup(); let [a,b,c,d] = &s.members;
    for m in &s.members { s.ayni.contribute(m); }
    let id = s.ayni.request(a, &(2 * UNIT), &String::from_str(&s.env, "urgencia"));
    s.ayni.vote(b, &id, &true); s.ayni.vote(c, &id, &true); s.ayni.resolve(&id);
    s.ayni.repay(a, &(2 * UNIT));
    let info = s.ayni.member(a);
    assert_eq!(info.repaid, 2 * UNIT); assert_eq!(info.reputation, 1);
    assert_eq!(s.ayni.fund(), 4 * UNIT);
    assert_eq!(s.token.balance(a), 19 * UNIT);
    let _ = d;
}
