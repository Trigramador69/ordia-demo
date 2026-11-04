// Nombres y apellidos frecuentes en Bolivia. Las personas de la demo combinan
// estas listas al azar, así que son inventadas.

export const nombresFemeninos = [
  "María Elena", "Ana María", "Carmen Rosa", "Patricia", "Rosa", "Ruth", "Gladys",
  "Sonia", "Delia", "Nelly", "Ximena", "Daniela", "Andrea", "Gabriela", "Verónica",
  "Lizeth", "Mónica", "Roxana", "Julia", "Teresa", "Paola", "Fabiola", "Brenda",
  "Elizabeth", "Lourdes", "Silvia", "Nancy", "Marisol", "Jhovana", "Wendy", "Noemí",
  "Rocío", "Claudia", "Mariela", "Yesenia", "Cinthia", "Karen", "Miriam", "Beatriz",
  "Viviana",
];

export const nombresMasculinos = [
  "Juan Carlos", "Luis Fernando", "José Luis", "Jorge", "Marco Antonio", "Wilson",
  "Freddy", "Edwin", "Reynaldo", "Germán", "Mauricio", "Rodrigo", "Sergio", "Álvaro",
  "Miguel Ángel", "Wilfredo", "Hugo", "Ramiro", "Cristian", "Kevin", "Jhonny", "Iván",
  "Pablo", "Óscar", "Rubén", "Gonzalo", "Fernando", "Raúl", "Eduardo", "Javier",
  "Nelson", "Limberth", "Henry", "Franz", "Daniel", "Alex", "Willy", "Ronald",
  "Grover", "Marcelo",
];

export const apellidos = [
  "Mamani", "Quispe", "Choque", "Condori", "Flores", "Vargas", "Rojas", "Gutiérrez",
  "Fernández", "Rodríguez", "López", "Torrico", "Villarroel", "Zurita", "Céspedes",
  "Arce", "Montaño", "Claros", "Salazar", "Camacho", "Rocha", "Peredo", "Soria",
  "Terrazas", "Vallejos", "Galarza", "Antezana", "Ugarte", "Siles", "Medrano",
  "Herbas", "Orellana", "Encinas", "Pinto", "Coca", "Ayala", "Gonzales", "Ticona",
  "Huanca", "Apaza", "Limachi", "Aguilar", "Paredes", "Guzmán", "Ríos", "Mercado",
  "Sejas", "Jiménez", "Navia", "Bustamante",
];

export const zonasPorCiudad = {
  Cochabamba: [
    "Cala Cala", "Queru Queru", "Sarco", "Villa Busch", "Muyurina", "Tupuraya",
    "Jaihuayco", "Temporal", "Lomas de Aranjuez", "Hipódromo",
  ],
  "La Paz": [
    "Sopocachi", "Miraflores", "Villa Fátima", "Achumani", "Obrajes", "San Pedro",
    "Calacoto", "Alto Sopocachi", "Irpavi", "Los Pinos",
  ],
  "Santa Cruz": [
    "Equipetrol", "Las Palmas", "Urbarí", "Sirari", "Hamacas", "Barrio Lindo",
    "Villa Primero de Mayo", "Plan Tres Mil", "Los Lotes", "Radial 26",
  ],
  Sucre: ["San Roque", "Villa Armonía", "Garcilazo", "El Tejar", "Lajastambo"],
  Tarija: ["Las Panosas", "San Roque", "El Molino", "Senac", "Aranjuez"],
  Oruro: ["Ferroviaria", "Agua de Castilla", "Vinto", "San José", "Villa Challacollo"],
} as const;

export const calles = [
  "Calle Jordán", "Calle Sucre", "Av. Circunvalación", "Calle Junín", "Calle Ecuador",
  "Av. Melchor Pérez", "Calle Colombia", "Calle Lanza", "Av. Uyuni", "Calle Mapiri",
  "Calle Hamiraya", "Av. Oquendo", "Calle 25 de Mayo", "Calle Chuquisaca", "Av. Libertador",
  "Av. Busch", "Calle Bolívar", "Av. Santos Dumont", "Calle Potosí", "Av. Petrolera",
];

// Parentescos en femenino y en masculino.
export const parentescos: [string[], string[]] = [
  ["madre", "hermana", "esposa", "hija"],
  ["padre", "hermano", "esposo", "hijo"],
];

// Palabras para armar razones sociales inventadas. Se combinan con un tipo de
// negocio del rubro ("Distribuidora", "Clínica"...) y una forma societaria.
export const nombresDeFantasia = [
  "Tunari", "Illimani", "Sajama", "Kantuta", "Patujú", "Amboró", "Mallku", "Totora",
  "Tiquipaya", "Cumbre Alta", "Horizonte Sur", "Valle Verde", "Sol Andino", "Río Rocha",
  "Altamira", "Puerta del Sol", "Los Molles", "Pirwa", "Cóndor Real", "Inti Raymi",
  "Chaco Verde", "Laguna Alalay", "San Rafael", "Santa Bárbara", "Tres Cruces",
  "Pampa Grande", "Monte Blanco", "Aroma", "Vallegrande", "Copacabana Norte",
  "Mirador", "El Roble", "Los Ceibos", "Nueva Esperanza", "Wayra", "Yungas",
  "Tupiza", "Samaipata", "Kuntur", "Achachila", "Ayni", "Uyuni Sur", "Las Lomas",
  "Bella Vista", "Aranjuez", "Itapaya", "Quillacollo Central", "Colcapirhua",
  "Tacuara", "Cerro Verde", "Piraí", "Mamoré", "Isiboro", "Chapare", "Pucara",
  "Jatun Kancha", "Sumaj", "Kallpa", "Tawa", "Chaska", "Killa", "Wiñay", "Pachaqhaqi",
  "Valle Alto", "Arani", "Punata", "Cliza", "Tarata", "Capinota", "Morochata",
  "Cordillera Real", "Los Tajibos", "El Cuchi", "Paurito", "Cotoca", "Warnes",
  "Buena Vista", "Guapay", "Ichilo", "Sara", "Cañaveral", "Toborochi", "Motacú",
  "Sauce Real", "Lomas del Sur", "Altos del Norte", "Pura Vida", "Nueva Era",
  "Punto Norte", "Andina del Sur", "Prisma", "Nexo", "Vértice", "Cimiento",
  "Trébol", "Faro Andino", "Brújula", "Sendero", "Raíces", "Alborada",
  "Quinta Real", "La Recoleta", "Tres Ríos", "Los Álamos",
];

export const formasSocietarias = ["S.R.L.", "S.A.", "Ltda.", "S.R.L.", "S.R.L."];

// Cargo del contacto en femenino y en masculino.
export const cargosDeContacto: [string, string][] = [
  ["Gerente general", "Gerente general"],
  ["Gerente administrativa", "Gerente administrativo"],
  ["Jefa de compras", "Jefe de compras"],
  ["Administradora", "Administrador"],
  ["Encargada de logística", "Encargado de logística"],
  ["Directora ejecutiva", "Director ejecutivo"],
  ["Responsable de recursos humanos", "Responsable de recursos humanos"],
  ["Jefa de operaciones", "Jefe de operaciones"],
  ["Contadora general", "Contador general"],
];
