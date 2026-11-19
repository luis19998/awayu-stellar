#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{vec, Address, Env};

fn code(e: Error) -> soroban_sdk::Error {
    soroban_sdk::Error::from_contract_error(e as u32)
}

struct Setup<'a> {
    env: Env,
    registry: RegistroClient<'a>,
    circle: Address,
    members: [Address; 3],
}

fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract_v2(admin.clone()).address();
    let members = [
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
    ];
    let member_list = vec![
        &env,
        members[0].clone(),
        members[1].clone(),
        members[2].clone(),
    ];
    let circle = env.register(
        pasanaku::Pasanaku,
        (admin, token, 1_000i128, 3_600u64, member_list),
    );
    let registry_id = env.register(Registro, ());
    let registry = RegistroClient::new(&env, &registry_id);
    Setup {
        env,
        registry,
        circle,
        members,
    }
}

fn register(s: &Setup, circle: &Address, name: &str, region: Symbol) -> u32 {
    s.registry.register(
        &s.members[0],
        circle,
        &String::from_str(&s.env, name),
        &region,
    )
}

#[test]
fn registra_fichas_y_pagina_en_orden() {
    let s = setup();
    let a = s.circle.clone();
    let b = Address::generate(&s.env);
    assert_eq!(register(&s, &a, "Ahorro La Paz", symbol_short!("lpz")), 0);
    assert_eq!(register(&s, &b, "Ahorro Tarija", symbol_short!("trj")), 1);

    assert_eq!(s.registry.count(), 2);
    let first = s.registry.get(&0);
    assert_eq!(first.circle, a);
    assert_eq!(first.creator, s.members[0]);
    assert_eq!(first.name, String::from_str(&s.env, "Ahorro La Paz"));
    assert_eq!(first.region, symbol_short!("lpz"));
    assert_eq!(first.created, 1_000);
    assert_eq!(first.index, 0);
    let page = s.registry.page(&1, &50);
    assert_eq!(page.len(), 1);
    assert_eq!(page.get(0).unwrap().circle, b);
    assert_eq!(s.registry.page(&20, &3).len(), 0);
    assert_eq!(s.registry.by_region(&symbol_short!("lpz")), vec![&s.env, a]);
    assert_eq!(s.registry.version(), 1);
}

#[test]
fn rechaza_region_y_nombre_invalidos() {
    let s = setup();
    let r = s.registry.try_register(
        &s.members[0],
        &s.circle,
        &String::from_str(&s.env, "Nombre válido"),
        &symbol_short!("xxx"),
    );
    assert_eq!(r.unwrap_err().unwrap(), code(Error::InvalidRegion));

    let r = s.registry.try_register(
        &s.members[0],
        &s.circle,
        &String::from_str(&s.env, "nombre\ninválido"),
        &symbol_short!("lpz"),
    );
    assert_eq!(r.unwrap_err().unwrap(), code(Error::InvalidName));

    let r = s.registry.try_register(
        &s.members[0],
        &s.circle,
        &String::from_str(&s.env, "control\u{0085}"),
        &symbol_short!("lpz"),
    );
    assert_eq!(r.unwrap_err().unwrap(), code(Error::InvalidName));
}

#[test]
fn no_registra_dos_veces_el_mismo_circulo() {
    let s = setup();
    register(&s, &s.circle, "Primero", symbol_short!("lpz"));
    let r = s.registry.try_register(
        &s.members[0],
        &s.circle,
        &String::from_str(&s.env, "Repetido"),
        &symbol_short!("lpz"),
    );
    assert_eq!(r.unwrap_err().unwrap(), code(Error::CircleAlreadyRegistered));
}

#[test]
fn join_verifica_membresia_del_contrato_pasanaku() {
    let s = setup();
    s.registry.join(&s.members[1], &s.circle);
    assert_eq!(s.registry.by_member(&s.members[1]), vec![&s.env, s.circle.clone()]);
    // Repetir join es idempotente y no duplica el círculo.
    s.registry.join(&s.members[1], &s.circle);
    assert_eq!(s.registry.by_member(&s.members[1]).len(), 1);

    let outsider = Address::generate(&s.env);
    let r = s.registry.try_join(&outsider, &s.circle);
    assert_eq!(r.unwrap_err().unwrap(), code(Error::NotMember));
}

#[test]
fn avales_unicos_por_miembro_y_circulo() {
    let s = setup();
    s.registry.join(&s.members[0], &s.circle);
    s.registry.join(&s.members[1], &s.circle);
    s.registry.endorse(&s.members[0], &s.circle);
    assert_eq!(s.registry.endorsements(&s.circle), 1);
    let r = s.registry.try_endorse(&s.members[0], &s.circle);
    assert_eq!(r.unwrap_err().unwrap(), code(Error::AlreadyEndorsed));
    s.registry.endorse(&s.members[1], &s.circle);
    assert_eq!(s.registry.endorsements(&s.circle), 2);

    let stranger = Address::generate(&s.env);
    let r = s.registry.try_endorse(&stranger, &s.circle);
    assert_eq!(r.unwrap_err().unwrap(), code(Error::NotJoined));
}
