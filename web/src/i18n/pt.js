import en from "./en.js";

const PT = {
  "El pasanaku que teje tu historial": "O pasanaku que tece seu histórico",
  "Ronda": "Rodada", "Cuota": "Contribuição", "Pozo": "Fundo", "Miembros": "Participantes",
  "Historial del círculo": "Histórico do círculo", "Personalizar": "Personalizar", "Compartir enlace": "Compartilhar link",
  "Conectar billetera": "Conectar carteira", "A tiempo": "No prazo", "Tarde": "Atrasado", "Faltó": "Não contribuiu",
  "Círculo completo": "Círculo completo", "Aportó": "Contribuiu", "Aportó tarde": "Contribuiu com atraso",
  "Falta aportar": "Falta contribuir", "Conecta tu billetera": "Conecte sua carteira", "No eres miembro": "Você não é participante",
  "Ya aportaste": "Você já contribuiu", "Aportar y firmar": "Contribuir e assinar", "Cancelar": "Cancelar",
  "Crear y firmar": "Criar e assinar", "Aplicar": "Aplicar", "Abrir": "Abrir", "Cerrar": "Fechar",
  "Simulador": "Simulador", "Crear círculo": "Criar círculo", "Billetera": "Carteira", "Desarrolladores": "Desenvolvedores",
  "Ayni · ayuda mutua": "Ayni · ajuda mútua", "Minka · proyectos": "Minka · projetos", "Alasitas · metas": "Alasitas · objetivos",
  "Ayuda mutua: un fondo común para emergencias, con votación de la comunidad.": "Ajuda mútua: um fundo comum para emergências, com votação da comunidade.",
  "Metas de ahorro con miniaturas: casa, estudio, negocio, viaje.": "Metas de economia com miniaturas: casa, estudos, negócio, viagem.",
  "Todos los tutoriales": "Todos os tutoriais", "En esta sección": "Nesta seção", "Recorrido de bienvenida": "Tour de boas-vindas",
  "Cada aporte, voto, hito o meta cumplida suma marcas al mismo aguayo: tu pasaporte de reputación portable en Stellar.": "Cada contribuição, voto, etapa ou meta concluída adiciona marcas ao mesmo aguayo: seu passaporte de reputação portátil na Stellar.",
  "Finanzas comunitarias andinas en Stellar": "Finanças comunitárias andinas na Stellar",
  "Dinero": "Dinheiro", "dinero": "dinheiro", "Nombre del círculo": "Nome do círculo", "Departamento": "Departamento",
};
export default Object.fromEntries(Object.keys(en).map((key) => [key, PT[key] ?? key]));
