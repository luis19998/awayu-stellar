use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};

const COMMIT_END: u64 = 200;
const REVEAL_END: u64 = 300;

struct Setup<'a> {
    env: Env,
    client: SorteoClient<'a>,
    organizer: Address,
    members: [Address; 4],
}

impl Setup<'_> {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|l| {
            l.timestamp = 100;
            l.sequence_number = 42;
        });
        let client = SorteoClient::new(&env, &env.register(Sorteo, ()));
        let organizer = Address::generate(&env);
        let members = core::array::from_fn(|_| Address::generate(&env));
        Self {
            env,
            client,
            organizer,
            members,
        }
    }

    fn create(&self) -> u32 {
        self.client.create(
            &self.organizer,
            &Vec::from_slice(&self.env, &self.members),
            &COMMIT_END,
            &REVEAL_END,
        )
    }

    fn set_time(&self, time: u64) {
        self.env.ledger().with_mut(|l| l.timestamp = time);
    }

    fn secret(&self, i: usize) -> BytesN<32> {
        BytesN::from_array(&self.env, &[i as u8 + 1; 32])
    }

    fn commit(&self, id: u32, i: usize) {
        let member = &self.members[i];
        self.client
            .commit(&id, member, &commitment(&self.env, member, &self.secret(i)));
    }

    fn reveal(&self, id: u32, i: usize) {
        self.client.reveal(&id, &self.members[i], &self.secret(i));
    }
}

// Cálculo del lado del cliente con los 32 bytes crudos y el ScVal XDR de la dirección.
fn commitment(env: &Env, member: &Address, secret: &BytesN<32>) -> BytesN<32> {
    let mut bytes = Bytes::from_slice(env, &secret.to_array());
    bytes.append(&member.clone().to_xdr(env));
    env.crypto().sha256(&bytes).to_bytes()
}

fn code(error: Error) -> soroban_sdk::Error {
    soroban_sdk::Error::from_contract_error(error as u32)
}

fn assert_permutation(order: &Vec<Address>, members: &[Address]) {
    assert_eq!(order.len() as usize, members.len());
    for member in members {
        assert!(order.contains(member));
    }
}

#[test]
fn cuatro_personas_revelan_y_pueden_cerrar_antes_del_plazo() {
    let s = Setup::new();
    let id = s.create();
    assert_eq!(s.env.auths()[0].0, s.organizer);
    assert_eq!(s.client.version(), 1);
    let initial = s.client.get(&id);
    assert_eq!(initial.state, DrawState::Commit);
    assert_eq!(
        (initial.commit_deadline, initial.reveal_deadline),
        (COMMIT_END, REVEAL_END)
    );
    assert!(initial.order.is_empty());
    s.set_time(COMMIT_END - 1);
    for i in 0..4 {
        s.commit(id, i);
        assert_eq!(s.env.auths()[0].0, s.members[i]);
    }
    s.set_time(COMMIT_END);
    assert_eq!(s.client.get(&id).state, DrawState::Reveal);
    for i in 0..4 {
        s.reveal(id, i);
        assert_eq!(s.env.auths()[0].0, s.members[i]);
    }
    assert_eq!(s.client.get(&id).state, DrawState::Ready);
    let order = s.client.finalize(&id);
    assert!(s.env.auths().is_empty());
    assert_permutation(&order, &s.members);
    let info = s.client.get(&id);
    assert_eq!(info.state, DrawState::Finalized);
    assert_eq!((info.committed, info.revealed), (4, 4));
    assert_eq!(info.order, order);
    assert!(!info.fallback);
}

#[test]
fn mismos_secretos_y_ledger_dan_el_mismo_orden() {
    let s = Setup::new();
    let a = s.create();
    let b = s.create();
    let c = s.create();
    assert_eq!((b, c), (a + 1, a + 2));
    for i in 0..4 {
        s.commit(a, i);
        s.commit(b, 3 - i);
        s.commit(c, i);
    }
    s.set_time(COMMIT_END);
    for i in 0..4 {
        s.reveal(a, i);
        s.reveal(b, 3 - i);
        s.reveal(c, i);
    }
    // Vectores calculados con SHA-256 independiente: XOR = [4; 32].
    let order = s.client.finalize(&a);
    assert_eq!(s.client.finalize(&b), order);
    assert_eq!(
        order,
        Vec::from_array(&s.env, [1, 0, 2, 3].map(|i: usize| s.members[i].clone()))
    );
    s.env.ledger().with_mut(|l| l.sequence_number = 43);
    assert_eq!(
        s.client.finalize(&c),
        Vec::from_array(&s.env, [2, 1, 3, 0].map(|i: usize| s.members[i].clone()))
    );
}

#[test]
fn se_comprueban_el_secreto_y_la_direccion() {
    let s = Setup::new();
    let id = s.create();
    s.commit(id, 0);
    // Otra persona presenta una copia del compromiso de la primera.
    let hash = commitment(&s.env, &s.members[0], &s.secret(0));
    s.client.commit(&id, &s.members[1], &hash);
    s.set_time(COMMIT_END);
    for (member, secret) in [(0, 1), (1, 0)] {
        let err = s
            .client
            .try_reveal(&id, &s.members[member], &s.secret(secret));
        assert_eq!(err.unwrap_err().unwrap(), code(Error::BadReveal));
    }
    assert_eq!(s.client.get(&id).revealed, 0);
    s.reveal(id, 0);
    s.reveal(id, 0);
    assert_eq!(s.client.get(&id).revealed, 1);
}

#[test]
fn los_plazos_se_aplican_en_el_instante_exacto() {
    let s = Setup::new();
    let id = s.create();
    s.set_time(COMMIT_END - 1);
    s.commit(id, 0);
    let early = s.client.try_reveal(&id, &s.members[0], &s.secret(0));
    assert_eq!(early.unwrap_err().unwrap(), code(Error::RevealNotOpen));
    s.set_time(COMMIT_END);
    let late = s.client.try_commit(&id, &s.members[1], &s.secret(1));
    assert_eq!(late.unwrap_err().unwrap(), code(Error::CommitClosed));
    s.set_time(REVEAL_END - 1);
    assert_eq!(
        s.client.try_finalize(&id).unwrap_err().unwrap(),
        code(Error::NotReady)
    );
    s.set_time(REVEAL_END);
    let closed = s.client.try_reveal(&id, &s.members[0], &s.secret(0));
    assert_eq!(closed.unwrap_err().unwrap(), code(Error::RevealClosed));
    assert_eq!(s.client.get(&id).state, DrawState::Ready);
    s.client.finalize(&id);
}

#[test]
fn quien_no_revela_queda_detras_de_todos_los_que_revelaron() {
    let s = Setup::new();
    let id = s.create();
    for i in [0, 1, 3] {
        s.commit(id, i);
    }
    s.set_time(REVEAL_END - 1);
    s.reveal(id, 3);
    s.reveal(id, 1);
    s.set_time(REVEAL_END);
    let order = s.client.finalize(&id);
    assert_permutation(&order, &s.members);
    for member in [1, 3] {
        assert!(order.first_index_of(&s.members[member]).unwrap() < 2);
    }
    let info = s.client.get(&id);
    assert_eq!((info.committed, info.revealed), (3, 2));
    assert!(!info.fallback);
}

#[test]
fn sin_revelaciones_el_respaldo_incluye_a_todos() {
    let s = Setup::new();
    let con_compromiso = s.create();
    let sin_compromisos = s.create();
    s.commit(con_compromiso, 2);
    s.set_time(REVEAL_END);
    for id in [con_compromiso, sin_compromisos] {
        assert_permutation(&s.client.finalize(&id), &s.members);
        let info = s.client.get(&id);
        assert!(info.fallback);
        assert_eq!(info.revealed, 0);
    }
}

#[test]
fn la_lista_y_los_plazos_deben_ser_validos() {
    let s = Setup::new();
    let create = |members: &Vec<Address>, commit, reveal| {
        s.client.try_create(&s.organizer, members, &commit, &reveal)
    };
    let member = s.members[0].clone();
    let mut list = Vec::from_array(&s.env, [member.clone()]);
    assert_eq!(
        create(&list, 200, 300).unwrap_err().unwrap(),
        code(Error::TooFew)
    );
    list.push_back(member);
    assert_eq!(
        create(&list, 200, 300).unwrap_err().unwrap(),
        code(Error::Duplicate)
    );
    list.set(1, s.members[1].clone());
    for (commit, reveal) in [(100, 300), (200, 200), (300, 200)] {
        assert_eq!(
            create(&list, commit, reveal).unwrap_err().unwrap(),
            code(Error::BadDeadlines)
        );
    }
    while list.len() < 100 {
        list.push_back(Address::generate(&s.env));
    }
    let id = s
        .client
        .create(&s.organizer, &list, &COMMIT_END, &REVEAL_END);
    list.push_back(Address::generate(&s.env));
    assert_eq!(
        create(&list, 200, 300).unwrap_err().unwrap(),
        code(Error::TooMany)
    );
    s.commit(id, 0);
    s.set_time(COMMIT_END);
    s.reveal(id, 0);
    s.set_time(REVEAL_END);
    let order = s.client.finalize(&id);
    assert_eq!(order.len(), 100);
    assert_eq!(order.get(0).unwrap(), s.members[0]);
}

#[test]
fn el_resultado_es_definitivo() {
    let s = Setup::new();
    let id = s.create();
    s.set_time(REVEAL_END);
    let first = s.client.finalize(&id);
    assert_eq!(
        s.client.try_finalize(&id).unwrap_err().unwrap(),
        code(Error::Finalized)
    );
    assert_eq!(s.client.get(&id).order, first);
}

#[test]
fn solo_los_inscritos_pueden_comprometerse_una_vez_y_revelar() {
    let s = Setup::new();
    let id = s.create();
    assert_eq!(
        s.client.try_get(&(id + 1)).unwrap_err().unwrap(),
        code(Error::NotFound)
    );
    s.commit(id, 0);
    let duplicate = s.client.try_commit(&id, &s.members[0], &s.secret(1));
    assert_eq!(
        duplicate.unwrap_err().unwrap(),
        code(Error::AlreadyCommitted)
    );
    let outsider = s.client.try_commit(&id, &s.organizer, &s.secret(0));
    assert_eq!(outsider.unwrap_err().unwrap(), code(Error::NotParticipant));
    s.set_time(COMMIT_END);
    let missing = s.client.try_reveal(&id, &s.members[1], &s.secret(1));
    assert_eq!(missing.unwrap_err().unwrap(), code(Error::NoCommit));
    s.reveal(id, 0);
    assert_eq!(s.client.get(&id).committed, 1);
}
