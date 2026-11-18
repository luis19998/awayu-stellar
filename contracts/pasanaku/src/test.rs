#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, vec, Address, Env};

fn code(e: Error) -> soroban_sdk::Error {
    soroban_sdk::Error::from_contract_error(e as u32)
}

const CUOTA: i128 = 100_0000000; // 100 USDC con 7 decimales
const SEMANA: u64 = 7 * 24 * 3600;

struct Setup<'a> {
    env: Env,
    members: [Address; 3],
    token: token::Client<'a>,
    circle: PasanakuClient<'a>,
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_000);

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::Client::new(&env, &sac.address());
    let minter = token::StellarAssetClient::new(&env, &sac.address());

    let members = [
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
    ];
    for m in members.iter() {
        minter.mint(m, &(CUOTA * 10));
    }
    let list = vec![&env, members[0].clone(), members[1].clone(), members[2].clone()];
    let id = env.register(Pasanaku, (admin, sac.address(), CUOTA, SEMANA, list));
    let circle = PasanakuClient::new(&env, &id);
    Setup { env, members, token, circle }
}

#[test]
fn ciclo_completo_cada_uno_cobra_una_vez() {
    let s = setup();
    let order = s.circle.get_config().members;
    assert_eq!(order.len(), 3);

    for round in 0..3u32 {
        for m in s.members.iter() {
            assert_eq!(s.circle.contribute(m), ON_TIME);
        }
        let info = s.circle.round_info();
        assert_eq!(info.round, round);
        assert_eq!(info.pot, CUOTA * 3);
        let who = s.circle.payout();
        assert_eq!(who, order.get(round).unwrap());
    }
    // Al final, todos aportaron 3 cuotas y cobraron un pozo de 3 cuotas.
    for m in s.members.iter() {
        assert_eq!(s.token.balance(m), CUOTA * 10);
        assert_eq!(s.circle.score(m), 100);
    }
}

#[test]
fn aporte_tardio_y_falta_quedan_en_el_aguayo() {
    let s = setup();
    let [a, b, c] = &s.members;
    s.circle.contribute(a);
    // b paga después del plazo y c no paga.
    s.env.ledger().with_mut(|l| l.timestamp = 1_000 + SEMANA + 60);
    assert_eq!(s.circle.contribute(b), LATE);
    s.circle.payout();

    assert_eq!(s.circle.history(a), vec![&s.env, ON_TIME]);
    assert_eq!(s.circle.history(b), vec![&s.env, LATE]);
    assert_eq!(s.circle.history(c), vec![&s.env, MISSED]);
    assert_eq!(s.circle.score(b), 50);
    assert_eq!(s.circle.score(c), 0);
}

#[test]
fn no_se_puede_cobrar_antes_de_tiempo() {
    let s = setup();
    s.circle.contribute(&s.members[0]);
    let r = s.circle.try_payout();
    assert_eq!(r.unwrap_err().unwrap(), code(Error::RoundStillOpen));
}

#[test]
fn no_se_aporta_dos_veces_ni_sin_ser_miembro() {
    let s = setup();
    s.circle.contribute(&s.members[0]);
    let r = s.circle.try_contribute(&s.members[0]);
    assert_eq!(r.unwrap_err().unwrap(), code(Error::AlreadyPaid));
    let extrano = Address::generate(&s.env);
    let r = s.circle.try_contribute(&extrano);
    assert_eq!(r.unwrap_err().unwrap(), code(Error::NotMember));
}
