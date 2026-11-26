#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{token, vec};

const AMOUNT: i128 = 10;
const START: u64 = 1000;
const PERIOD: u64 = 600;
const INITIAL: i128 = 100;

struct Setup<'a> {
    env: Env,
    circle: RemateClient<'a>,
    token: token::Client<'a>,
    escrow: Address,
    people: [Address; 4],
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = START);
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::Client::new(&env, &sac.address());
    let mint = token::StellarAssetClient::new(&env, &sac.address());
    let people = core::array::from_fn(|_| Address::generate(&env));
    let mut members = Vec::new(&env);
    for person in &people {
        mint.mint(person, &INITIAL);
        members.push_back(person.clone());
    }
    let escrow = env.register(Remate, (admin, sac.address(), AMOUNT, PERIOD, members));
    let circle = RemateClient::new(&env, &escrow);
    Setup {
        env,
        circle,
        token,
        escrow,
        people,
    }
}

impl Setup<'_> {
    fn everyone_contributes(&self) {
        for person in &self.people {
            assert_eq!(self.circle.contribute(person), ON_TIME);
        }
    }
}

fn code(error: Error) -> soroban_sdk::Error {
    soroban_sdk::Error::from_contract_error(error as u32)
}

#[test]
fn sin_pujas_cobra_el_primero_del_sorteo() {
    let s = setup();
    let first = s.circle.members().get(0).unwrap().address;
    assert_eq!(s.circle.version(), 1);
    assert_eq!(s.circle.score(&first), 0);
    assert_eq!(s.circle.round_info().recipient, Some(first.clone()));
    s.everyone_contributes();
    assert_eq!(s.circle.settle(), first);
    assert_eq!(s.token.balance(&first), INITIAL - AMOUNT + 40);
    assert_eq!(s.token.balance(&s.escrow), 0);
}

#[test]
fn la_puja_mayor_reparte_el_descuento_y_arrastra_el_sobrante() {
    let s = setup();
    let [a, b, c, d] = &s.people;
    s.circle.deposit_guarantee(d);
    s.everyone_contributes();
    s.circle.bid(a, &1000);
    s.circle.bid(b, &3250);
    assert_eq!(s.env.auths()[0].0, *b);
    assert_eq!(s.circle.round_info().recipient, Some(b.clone()));
    assert_eq!(s.circle.settle(), *b);
    // Pozo 40, descuento 13: el ganador recibe 27, las otras tres personas 4.
    let net = s.token.balance(b) - (INITIAL - AMOUNT);
    assert_eq!(net, 27);
    for other in [a, c, d] {
        let reserve = if other == d { AMOUNT } else { 0 };
        assert_eq!(s.token.balance(other) - (INITIAL - AMOUNT - reserve), 4);
    }
    let info = s.circle.round_info();
    assert_eq!((info.round, info.paid, info.carry, info.pot), (1, 0, 1, 1));
    assert_eq!(s.token.balance(&s.escrow), AMOUNT + info.carry);
    assert_eq!(net + 3 * 4 + info.carry, 40);
    assert!(s.circle.bids().is_empty());

    s.everyone_contributes();
    assert_eq!(s.circle.round_info().pot, 41);
    let next = s.circle.round_info().recipient.unwrap();
    let before = s.token.balance(&next);
    assert_eq!(s.circle.settle(), next);
    assert_eq!(s.token.balance(&next) - before, 41);
    assert_eq!(s.token.balance(&s.escrow), AMOUNT);
}

#[test]
fn empate_respeta_la_primera_puja_incluso_si_se_actualiza() {
    let s = setup();
    let order = s.circle.members();
    let early = order.get(3).unwrap().address;
    let late = order.get(0).unwrap().address;
    s.everyone_contributes();
    s.circle.bid(&early, &0);
    s.circle.bid(&late, &5000);
    s.circle.bid(&early, &5000);
    s.circle.bid(&early, &5000);
    assert_eq!(
        s.circle.bids(),
        vec![&s.env, (early.clone(), 5000u32), (late, 5000u32)]
    );
    assert_eq!(s.circle.settle(), early);
}

#[test]
fn la_puja_exige_aporte_limite_y_turno_pendiente() {
    let s = setup();
    let a = &s.people[0];
    let outside = Address::generate(&s.env);
    assert_eq!(
        s.circle.try_bid(&outside, &0).unwrap_err().unwrap(),
        code(Error::NotMember)
    );
    assert_eq!(
        s.circle.try_bid(a, &0).unwrap_err().unwrap(),
        code(Error::NotContributed)
    );
    s.everyone_contributes();
    assert_eq!(
        s.circle.try_contribute(a).unwrap_err().unwrap(),
        code(Error::AlreadyPaid)
    );
    assert_eq!(
        s.circle.try_bid(a, &5001).unwrap_err().unwrap(),
        code(Error::BidTooHigh)
    );
    s.circle.bid(a, &200);
    assert_eq!(
        s.circle.try_bid(a, &199).unwrap_err().unwrap(),
        code(Error::BidLower)
    );
    assert_eq!(s.circle.bids(), vec![&s.env, (a.clone(), 200u32)]);
    assert_eq!(s.circle.settle(), *a);
    s.circle.contribute(a);
    assert_eq!(
        s.circle.try_bid(a, &300).unwrap_err().unwrap(),
        code(Error::AlreadyWon)
    );
}

#[test]
fn la_garantia_completa_el_pozo_y_solo_los_aportantes_comparten_el_descuento() {
    let s = setup();
    let [a, b, c, d] = &s.people;
    s.circle.deposit_guarantee(d);
    s.circle.contribute(a);
    s.circle.contribute(b);
    s.env.ledger().with_mut(|l| l.timestamp = START + PERIOD);
    s.circle.bid(a, &2500);
    assert_eq!(
        s.circle.try_settle().unwrap_err().unwrap(),
        code(Error::RoundStillOpen)
    );
    s.env.ledger().with_mut(|l| l.timestamp += 1);
    assert_eq!(s.circle.contribute(c), LATE);
    assert_eq!(
        s.circle.try_bid(c, &3000).unwrap_err().unwrap(),
        code(Error::BidDeadlinePassed)
    );
    let info = s.circle.round_info();
    assert_eq!((info.paid, info.covered, info.pot), (3, 1, 30));
    assert_eq!(s.circle.settle(), *a);
    assert_eq!(s.token.balance(a), INITIAL - AMOUNT + 30);
    for other in [b, c] {
        assert_eq!(s.token.balance(other), INITIAL - AMOUNT + 5);
    }
    assert_eq!(s.token.balance(d), INITIAL - AMOUNT);
    assert_eq!(s.circle.history(d), vec![&s.env, COVERED]);
    assert_eq!(s.circle.score(d), 25);
    assert_eq!(s.circle.score(c), 50);
    let covered = s.circle.members().iter().find(|m| &m.address == d).unwrap();
    assert_eq!(
        (covered.guarantee, covered.won, covered.paid),
        (0, false, 0)
    );
    assert_eq!(covered.history, s.circle.history(d));
    assert_eq!(s.token.balance(&s.escrow), 0);
}

#[test]
fn un_solo_aportante_deja_el_descuento_para_la_ronda_siguiente() {
    let s = setup();
    let [a, b, c, _] = &s.people;
    s.circle.contribute(a);
    s.circle.bid(a, &5000);
    s.env
        .ledger()
        .with_mut(|l| l.timestamp = START + PERIOD + 1);
    assert_eq!(s.circle.settle(), *a);
    assert_eq!(s.circle.history(b), vec![&s.env, MISSED]);
    assert_eq!(s.circle.score(b), 0);
    assert_eq!(s.circle.round_info().carry, 5);
    assert_eq!(s.token.balance(a), INITIAL - AMOUNT + 5);
    assert_eq!(s.token.balance(&s.escrow), 5);
    s.everyone_contributes();
    s.circle.bid(c, &0);
    assert_eq!(s.circle.settle(), *c);
    assert_eq!(s.token.balance(c), INITIAL - AMOUNT + 45);
    assert_eq!(s.circle.score(b), 50);
}

#[test]
fn cada_miembro_cobra_una_vez_y_puede_recuperar_su_garantia() {
    let s = setup();
    let order = s.circle.members();
    let last_in_order = order.get(3).unwrap().address;
    s.circle.deposit_guarantee(&last_in_order);
    assert_eq!(
        s.circle
            .try_deposit_guarantee(&last_in_order)
            .unwrap_err()
            .unwrap(),
        code(Error::AlreadyGuaranteed)
    );
    assert_eq!(
        s.circle
            .try_withdraw_guarantee(&last_in_order)
            .unwrap_err()
            .unwrap(),
        code(Error::CircleNotFinished)
    );
    for index in 0..4 {
        s.everyone_contributes();
        let expected = if index == 0 {
            s.circle.bid(&last_in_order, &0);
            last_in_order.clone()
        } else {
            order.get(index - 1).unwrap().address
        };
        assert_eq!(s.circle.settle(), expected);
        assert_eq!(
            s.circle.members().iter().filter(|m| m.won).count(),
            index as usize + 1
        );
    }
    let info = s.circle.round_info();
    assert_eq!((info.round, info.recipient, info.pot), (4, None, 0));
    assert_eq!(
        s.circle.try_settle().unwrap_err().unwrap(),
        code(Error::CircleFinished)
    );
    assert_eq!(
        s.circle.try_bid(&last_in_order, &0).unwrap_err().unwrap(),
        code(Error::CircleFinished)
    );
    assert_eq!(s.circle.withdraw_guarantee(&last_in_order), AMOUNT);
    assert_eq!(
        s.circle
            .try_withdraw_guarantee(&last_in_order)
            .unwrap_err()
            .unwrap(),
        code(Error::NoGuarantee)
    );
    for person in &s.people {
        assert_eq!(
            s.circle.history(person),
            vec![&s.env, ON_TIME, ON_TIME, ON_TIME, ON_TIME]
        );
        assert_eq!(s.circle.score(person), 100);
        assert_eq!(s.token.balance(person), INITIAL);
    }
}

#[test]
fn ultima_puja_premia_a_quienes_ya_cobraron_y_muestra_el_sobrante_final() {
    let s = setup();
    for _ in 0..3 {
        s.everyone_contributes();
        s.circle.settle();
    }
    let winner = s.circle.round_info().recipient.unwrap();
    s.everyone_contributes();
    s.circle.bid(&winner, &3250);
    assert_eq!(s.circle.settle(), winner);
    for person in &s.people {
        // Todos aportaron 40. Los tres primeros cobraron 40 y reciben otros 4.
        let received = if person == &winner { 27 } else { 44 };
        assert_eq!(s.token.balance(person), INITIAL - 40 + received);
    }
    assert_eq!(s.token.balance(&s.escrow), 1);
    let info = s.circle.round_info();
    assert_eq!((info.recipient, info.carry), (None, 1));
}

#[test]
fn descuento_en_unidades_minimas_sin_desbordar() {
    assert_eq!(discount_amount(39, 1000), 3);
    assert_eq!(discount_amount(i128::MAX, 5000), i128::MAX / 2);
}
