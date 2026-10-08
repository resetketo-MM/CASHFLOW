require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8080;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Información aprobada: las terminaciones NO son números completos de pago.
const DATOS_NEGOCIO = {
  nombre: "Keto Reset 28",
  precio: 79,
  duracion: 28,
  upsell: 49,
  adicional: "Postres Keto Antojos",
  diasBono: 21
};

const DATOS_PAGO = {
  banco: process.env.BANCO_PAGO || "Spin by OXXO",
  titular: process.env.TITULAR_PAGO || "IVAN HERRERA GONZALEZ",
  cuenta: process.env.CUENTA_PAGO,
  terminacionTransferencia: "9153",
  terminacionDeposito: "6213"
};

// No enviamos cuentas completas ni eventos de pago: ManyChat gestiona esos datos.
// Este endpoint no tiene historial, identificador de cliente ni confirmaciones externas.
const BASE_CONOCIMIENTO = {
  precio: {
    texto: `😊 Nuestro paquete ${DATOS_NEGOCIO.nombre} cuesta solamente $${DATOS_NEGOCIO.precio} MXN. Incluye el reto de ${DATOS_NEGOCIO.duracion} días, recetas, postres, jugos, guía de ayuno y bonos adicionales. Todo en formato digital.`,
    cierre: `¿Te gustaría conocer cómo puedes recibirlo?`
  },
  contenido: {
    texto: `¡Claro! 😊 Nuestro paquete ${DATOS_NEGOCIO.nombre} incluye un reto de alimentación de ${DATOS_NEGOCIO.duracion} días, recetas de postres keto, jugos y batidos, una guía de ayuno intermitente y un bono antiinflamatorio de ${DATOS_NEGOCIO.diasBono} días. Además, recibes recetas para diabéticos y más de 100 videos internacionales como bonos adicionales. 📚 Todo es digital y el paquete completo cuesta solamente $${DATOS_NEGOCIO.precio} MXN.`,
    cierre: `¿Te gustaría que te explique cómo recibirlo?`
  },
  funcionamiento: {
    texto: `¡Es muy sencillo! 😊 ${DATOS_NEGOCIO.nombre} incluye un menú organizado día por día durante ${DATOS_NEGOCIO.duracion} días, para que tengas una guía de qué preparar en cada jornada. Además, recibirás recetas keto, postres, jugos, batidos y materiales complementarios que te ayudarán a tener más opciones de alimentación. Todo viene en formato digital, así que podrás consultar tu menú y seguir el reto a tu ritmo. 🥑`,
    cierre: `¿Te gustaría recibir el programa completo por solo $${DATOS_NEGOCIO.precio} MXN?`
  },
  principiantes: {
    texto: `¡Claro! 😊 No necesitas haber hecho keto antes para utilizar nuestro material. ${DATOS_NEGOCIO.nombre} incluye un menú organizado día por día durante ${DATOS_NEGOCIO.duracion} días, para que tengas una guía de qué preparar sin tener que planear todas tus comidas desde cero. 🥑 Si tienes alguna condición médica o tomas medicamentos, es importante consultar con un profesional de salud antes de cambiar tu alimentación.`,
    cierre: `¿Te gustaría conocer todo lo que incluye el paquete por solo $${DATOS_NEGOCIO.precio} MXN?`
  },
  resultados: {
    texto: `¡Buena pregunta! 😊 La cantidad de peso que puedes perder varía de una persona a otra, por eso no sería correcto prometerte una cantidad exacta de kilos. ${DATOS_NEGOCIO.nombre} te proporciona un menú organizado para ${DATOS_NEGOCIO.duracion} días y recetas que te ayudan a planificar tu alimentación sin empezar desde cero. 🥑 Si tu objetivo es bajar de peso, lo ideal es acompañar cualquier cambio de alimentación con orientación profesional para asegurarte de que sea adecuado para ti.`,
    cierre: `¿Te gustaría conocer cómo está organizado nuestro reto de ${DATOS_NEGOCIO.duracion} días?`
  },
  entrega: {
    texto: `¡Es muy sencillo! 😊 Recibirás tu material de ${DATOS_NEGOCIO.nombre} en formato digital, a través de enlaces enviados por WhatsApp. Primero podrás conocer una muestra gratuita de nuestras Recetas de Antojos. Después de realizar tu pago y validar el comprobante, recibirás acceso al paquete completo, incluyendo el menú de ${DATOS_NEGOCIO.duracion} días, las recetas y todos los bonos. 🥑📚 ¡Todo desde tu celular, sin esperar envíos físicos!`,
    cierre: `¿Te gustaría recibir tu muestra gratuita?`
  },
  tiempo: {
    texto: `¡La entrega es completamente digital! 😊 Una vez que realices tu pago y se valide tu comprobante, recibirás los enlaces de acceso al paquete completo de ${DATOS_NEGOCIO.nombre} directamente por WhatsApp. 📲🥑 No necesitas esperar envíos físicos. Si tienes alguna dificultad para recibir tu material, podemos ayudarte.`,
    cierre: `¿Te gustaría conocer cómo realizar tu pago?`
  },
  postpago: {
    texto: `¡Claro! 😊 Puedes conocer una muestra gratuita de nuestras Recetas de Antojos antes de realizar tu compra. Así tendrás la oportunidad de revisar parte de nuestro contenido sin compromiso. 🥑 Si decides adquirir ${DATOS_NEGOCIO.nombre}, el paquete completo cuesta solamente $${DATOS_NEGOCIO.precio} MXN y recibirás tus enlaces de acceso una vez que se confirme tu pago.`,
    cierre: `¿Te gustaría recibir tu muestra gratuita?`
  },
  transferencia: {
    texto: `¡Claro que sí! 😊 Puedes adquirir tu paquete ${DATOS_NEGOCIO.nombre} mediante transferencia bancaria por solo $${DATOS_NEGOCIO.precio} MXN. Te compartiremos los datos de pago de nuestra cuenta ${DATOS_PAGO.banco} a través de este mismo WhatsApp. 🏦 Una vez que realices tu transferencia, envíanos aquí tu comprobante para validarlo. Después de confirmar tu pago, recibirás los enlaces de acceso a tu paquete completo. 🥑📚`,
    cierre: `¿Te gustaría que te enviemos los datos para realizar tu transferencia?`
  },
  oxxo: {
    texto: `¡Claro que sí! 😊 Puedes adquirir ${DATOS_NEGOCIO.nombre} pagando en tu tienda OXXO por solo $${DATOS_NEGOCIO.precio} MXN. Te compartiremos por este mismo WhatsApp los datos necesarios para realizar tu depósito. 🏪 Una vez que hayas pagado, envíanos una foto clara de tu comprobante para que podamos validarlo. Después de confirmar tu pago, recibirás los enlaces de acceso a tu paquete completo. 🥑📚`,
    cierre: `¿Te gustaría realizar tu pago en OXXO?`
  },
  comprobante: {
    texto: `¡Puedes enviarlo aquí mismo! 😊📲 Una vez que realices tu transferencia o depósito en OXXO, envíanos una foto clara o captura de tu comprobante por este mismo WhatsApp. Procura que se vean el monto, la fecha y los datos de la operación para facilitar su revisión. Cuando tu pago sea validado, recibirás los enlaces de acceso a tu paquete completo ${DATOS_NEGOCIO.nombre}. 🥑`,
    cierre: `Si tienes algún problema para enviarlo, podemos orientarte.`
  },
  rechazado: {
    texto: `¡No te preocupes! 😊 Si tu comprobante no pudo validarse, vamos a ayudarte a revisar qué ocurrió. En ocasiones, la imagen puede estar borrosa o algunos datos no se distinguen correctamente. Si ese es el problema, te pediremos que envíes una foto más clara donde se vean el monto, la fecha y los datos de la operación. 📲 Si después de intentarlo el problema continúa, puedes solicitar revisión humana por este mismo WhatsApp para darle seguimiento. Por favor, no realices otro pago mientras revisamos tu comprobante.`,
    cierre: `Vamos a ayudarte a revisar lo sucedido para que puedas recibir tu material.`
  },
  bonos: {
    texto: `¡Sí! 🎁🥑 Con ${DATOS_NEGOCIO.nombre} recibes varios materiales adicionales sin pagar extra. Además de tu menú organizado para ${DATOS_NEGOCIO.duracion} días, obtienes un bono antiinflamatorio de ${DATOS_NEGOCIO.diasBono} días, recetas para diabéticos y más de 100 videos internacionales con ideas de preparación. También tendrás recetarios de postres keto, jugos y batidos, y una guía de ayuno intermitente. 📚 ¡Todo incluido en tu paquete por solo $${DATOS_NEGOCIO.precio} MXN!`,
    cierre: `¿Te gustaría conocer cómo adquirirlo?`
  },
  acceso: {
    texto: `¡Tus materiales son tuyos para conservarlos! 😊🥑 Una vez que se confirme tu pago, recibirás los enlaces para descargar tu paquete completo de ${DATOS_NEGOCIO.nombre}. Podrás guardar los archivos en tu celular, computadora o dispositivo compatible y consultarlos cuantas veces quieras, sin límite de tiempo. 📚 Aunque el reto está organizado para ${DATOS_NEGOCIO.duracion} días, puedes volver a utilizar tus recetas y materiales cuando lo necesites.`,
    cierre: `¿Te gustaría conocer cómo adquirir el paquete completo por solo $${DATOS_NEGOCIO.precio} MXN?`
  },
  formato: {
    texto: `¡Claro que sí! 😊📱 Los recetarios, menús y guías de ${DATOS_NEGOCIO.nombre} vienen en formato PDF, por lo que puedes abrirlos desde tu celular, tablet o computadora utilizando una aplicación compatible. También recibirás videos digitales como parte de tus bonos. 🎥🥑 Una vez que se confirme tu pago, recibirás los enlaces para descargar tus materiales por WhatsApp. Podrás guardar tus archivos y consultarlos cuando quieras, sin necesidad de tenerlos impresos.`,
    cierre: `¿Te gustaría recibir el paquete completo por solo $${DATOS_NEGOCIO.precio} MXN?`
  },
  confianza: {
    texto: `¡Entiendo perfectamente tu duda! 😊 Es normal querer asegurarte antes de realizar una compra por internet. En ${DATOS_NEGOCIO.nombre} puedes conocer primero una muestra gratuita de nuestras recetas, para que revises parte del material antes de decidir. El paquete completo cuesta $${DATOS_NEGOCIO.precio} MXN, sin cargos adicionales obligatorios, y te explicamos cómo realizar tu pago y recibir tus archivos digitales. Si tienes alguna pregunta antes de comprar, con gusto te ayudamos. 💚`,
    cierre: `¿Te gustaría recibir la muestra gratuita para conocer nuestro contenido?`
  },
  garantia: {
    texto: `¡Entendemos tu preocupación! 😊 Queremos que tengas una buena experiencia con ${DATOS_NEGOCIO.nombre}. Por eso, antes de comprar puedes conocer una muestra gratuita de nuestras recetas y resolver cualquier duda sobre el contenido. Si después de adquirir tu paquete algo no cumple con tus expectativas o tienes algún inconveniente, puedes solicitar atención por este mismo WhatsApp. 💚 Revisaremos tu caso de manera individual para orientarte y buscar una solución adecuada. Estamos aquí para ayudarte. 📲`,
    cierre: `Cuéntanos qué ocurrió para poder ayudarte.`
  },
  reembolso: {
    texto: `¡Claro! 😊💚 Si deseas solicitar un reembolso de tu compra de ${DATOS_NEGOCIO.nombre}, podemos ayudarte a revisar tu caso. Con esa información, puedes solicitar una revisión personalizada a nuestro equipo de atención por este mismo WhatsApp. 📲 El equipo evaluará tu solicitud y te orientará sobre los siguientes pasos, de acuerdo con las condiciones de compra y los derechos que correspondan. Estamos aquí para ayudarte.`,
    cierre: `Cuéntame brevemente el motivo de tu solicitud para ayudarte con la revisión.`
  },
  salud: {
    texto: `¡Qué bueno que lo preguntas! 😊🥑 ${DATOS_NEGOCIO.nombre} incluye un menú organizado para ${DATOS_NEGOCIO.duracion} días, recetas keto y un bono con recetas para personas con diabetes. Sin embargo, tener recetas para diabéticos no significa que el programa sea adecuado para todas las personas con diabetes. Si tienes diabetes, hipertensión, problemas renales u otra condición médica, o si tomas medicamentos, es importante que consultes con tu médico o nutriólogo antes de comenzar una alimentación keto. Esto es especialmente importante si utilizas medicamentos para controlar la glucosa, ya que cambiar tu alimentación puede requerir ajustes supervisados. 💚 Queremos que disfrutes nuestro material, pero tu salud siempre será lo primero.`,
    cierre: `¿Te gustaría conocer qué materiales incluye ${DATOS_NEGOCIO.nombre}?`
  },
  soporte: {
    texto: `¡Con mucho gusto te ayudamos! 😊💚 Si tienes algún problema con tu compra de ${DATOS_NEGOCIO.nombre}, no puedes abrir tus archivos, no recibiste algún material o tienes dudas sobre tu pago, puedes escribirnos por este mismo WhatsApp. Si se trata de algo que no podemos resolver automáticamente, puedes solicitar la intervención de nuestro equipo de atención por este mismo WhatsApp para revisar tu caso de manera personalizada. 📲 Queremos que puedas disfrutar de todo el material que adquiriste. 🥑📚`,
    cierre: `Cuéntame qué problema estás teniendo para ayudarte.`
  },
};

const SYSTEM_PROMPT = `
Eres Alexa, asistente de Keto Reset 28 por WhatsApp. Responde en español natural,
con párrafos cortos y emojis moderados. Responde primero la duda concreta.
No repitas saludos, preguntas ni cierres; no presiones a comprar.
Este endpoint solo recibe el mensaje actual: no inventes historial ni memoria.

INFORMACIÓN OFICIAL:
${DATOS_NEGOCIO.nombre} cuesta $${DATOS_NEGOCIO.precio} MXN, pago único.
Incluye menú día por día durante ${DATOS_NEGOCIO.duracion} días, recetas keto,
recetarios de postres keto, jugos y batidos, guía de ayuno intermitente,
bono antiinflamatorio de ${DATOS_NEGOCIO.diasBono} días, recetas para personas
con diabetes y más de 100 videos internacionales con ideas de preparación.
Menús, recetarios y guías en PDF. Videos digitales: no inventes su extensión.
${DATOS_NEGOCIO.adicional} es otro producto opcional de $${DATOS_NEGOCIO.upsell} MXN;
no confundirlo con los postres incluidos ni presentarlo como obligatorio.

Antes de pagar solo se puede ofrecer una muestra gratuita de Recetas de Antojos.
El paquete completo se entrega por enlaces de WhatsApp únicamente después de
confirmar y validar el pago. No prometas minutos concretos ni entrega inmediata.
Los archivos descargados pueden conservarse sin límite de tiempo;
no garantices que los enlaces permanezcan activos para siempre.

Transferencia bancaria mediante ${DATOS_PAGO.banco} o depósito en efectivo en OXXO
a la tarjeta Spin. Referencias autorizadas: titular ${DATOS_PAGO.titular},
terminación de transferencia ${DATOS_PAGO.terminacionTransferencia},
terminación de tarjeta ${DATOS_PAGO.terminacionDeposito}. Son solo referencias;
NO construyas ni inventes CLABE, cuenta ni tarjeta completa a partir de ellas.
Los datos completos y botones se solicitan en el flujo existente de ManyChat.
Una respuesta de texto NO ejecuta un botón ni un disparador de ManyChat/n8n.
No inventes enlaces, endpoints, tablas, campos, testimonios, certificaciones,
reseñas, promociones, descuentos, plazos ni acciones externas.
No solicites contraseñas, claves, códigos de seguridad ni datos bancarios completos.

El comprobante se envía como foto o captura por este mismo WhatsApp;
deben distinguirse monto, fecha y datos relevantes. Si es ilegible, pide una foto
más clara. Si persiste, invita a solicitar revisión humana por este WhatsApp.
Conserva la palabra LISTO si el cliente la utiliza en el flujo actual.
Nunca afirmes que validaste un pago, entregaste archivos, aprobaste o rechazaste
un reembolso ni derivaste un caso: este endpoint no tiene esas confirmaciones.
No pidas un segundo pago mientras se revisa un comprobante rechazado.

Atención y revisión individual de insatisfacción; no existe garantía automática.
Para reembolso, solicita el motivo solo si no está en el mensaje y orienta a
solicitar revisión humana. No apruebes ni rechaces devoluciones automáticamente.
Respeta los derechos aplicables del consumidor.
Ante soporte o pagos ya realizados, ayuda sin volver a invitar a comprar o pagar.
Si ya se describe un problema, no pidas otra vez la misma información.

No diagnostiques, no garantices pérdida de peso ni curación/control de enfermedades
ni seguridad universal de keto. Recetas para diabetes no implican idoneidad médica.
Ante condiciones médicas o medicamentos, recomienda consultar al médico o nutriólogo.
Ante síntomas o riesgos concretos, prioriza orientación sanitaria apropiada;
si hay síntomas graves, aconseja buscar atención médica urgente sin diagnosticar.
No agregues cierres de venta en consultas médicas delicadas ni quejas.

RESPUESTAS OFICIALES DE REFERENCIA:
${Object.entries(BASE_CONOCIMIENTO).map(([intencion, dato]) =>
  `${intencion}: ${dato.texto} ${dato.cierre}`
).join("\n\n")}

Si no tienes información suficiente, indica que el dato necesita confirmación.
No afirmes acciones que no realizaste ni simules atención humana.
`;

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contieneAlguna(texto, frases) {
  const mensaje = ` ${normalizarTexto(texto)} `;
  return frases.some((frase) => mensaje.includes(` ${normalizarTexto(frase)} `));
}

function elegirAleatoria(opciones) {
  return opciones[
    Math.floor(Math.random() * opciones.length)
  ];
}

function limpiarRespuesta(valor) {
  return String(valor ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// El microcierre pertenece a la intención; no se elige un cierre aleatorio.
function cierrePago(intencion) {
  return BASE_CONOCIMIENTO[intencion]?.cierre || "";
}

function cierreComercial(intencion) {
  return cierrePago(intencion);
}

function agregarCierre(respuesta, intencion, permitirCierre = true) {
  const texto = limpiarRespuesta(respuesta);
  const cierre = permitirCierre ? cierrePago(intencion) : "";
  if (!cierre || texto.includes(cierre)) return texto;
  return `${texto}\n\n${cierre}`;
}

function respuestaAprobada(intencion, permitirCierre = true) {
  return agregarCierre(BASE_CONOCIMIENTO[intencion].texto, intencion, permitirCierre);
}

function respuestaPrecio(permitirCierre = true) {
  return respuestaAprobada("precio", permitirCierre);
}

function respuestaContenido(permitirCierre = true) {
  return respuestaAprobada("contenido", permitirCierre);
}

function respuestaFuncionamiento(permitirCierre = true) {
  return respuestaAprobada("funcionamiento", permitirCierre);
}

function respuestaPrincipiantes(permitirCierre = true) {
  return respuestaAprobada("principiantes", permitirCierre);
}

function respuestaResultados(permitirCierre = true) {
  return respuestaAprobada("resultados", permitirCierre);
}

function respuestaEntrega(permitirCierre = true) {
  return respuestaAprobada("entrega", permitirCierre);
}

function respuestaTiempo(permitirCierre = true) {
  return respuestaAprobada("tiempo", permitirCierre);
}

function respuestaPostpago(permitirCierre = true) {
  return respuestaAprobada("postpago", permitirCierre);
}

function respuestaTransferencia(permitirCierre = true) {
  return respuestaAprobada("transferencia", permitirCierre);
}

function respuestaOxxo(permitirCierre = true) {
  return respuestaAprobada("oxxo", permitirCierre);
}

function respuestaComprobante(permitirCierre = true) {
  return respuestaAprobada("comprobante", permitirCierre);
}

function respuestaRechazado(permitirCierre = true) {
  return respuestaAprobada("rechazado", permitirCierre);
}

function respuestaBonos(permitirCierre = true) {
  return respuestaAprobada("bonos", permitirCierre);
}

function respuestaAcceso(permitirCierre = true) {
  return respuestaAprobada("acceso", permitirCierre);
}

function respuestaFormato(permitirCierre = true) {
  return respuestaAprobada("formato", permitirCierre);
}

function respuestaConfianza(permitirCierre = true) {
  return respuestaAprobada("confianza", permitirCierre);
}

function respuestaGarantia(permitirCierre = true) {
  return respuestaAprobada("garantia", permitirCierre);
}

function respuestaReembolso(permitirCierre = true) {
  return respuestaAprobada("reembolso", permitirCierre);
}

function respuestaSalud(permitirCierre = true) {
  return respuestaAprobada("salud", permitirCierre);
}

function respuestaSoporte(permitirCierre = true) {
  return respuestaAprobada("soporte", permitirCierre);
}

// Compatibilidad con nombres y consultas anteriores, sin confundir productos.
function respuestaIncluye() { return respuestaContenido(); }
function respuestaFunciona() { return respuestaFuncionamiento(); }
function respuestaDiabetes() { return respuestaSalud(false); }
function respuestaPermanente() { return respuestaAcceso(); }
function respuestaCuenta() { return respuestaTransferencia(); }

function respuestaPagar() {
  return `💳 Puedes pagar por transferencia mediante ${DATOS_PAGO.banco} o depósito en efectivo en una tienda OXXO. Elige el método en el flujo de pago de este mismo WhatsApp. Después, envía tu comprobante para validarlo.`;
}

function respuestaDuracion() {
  return `🗓️ ${DATOS_NEGOCIO.nombre} tiene un menú organizado día por día durante ${DATOS_NEGOCIO.duracion} días. Los archivos descargados pueden conservarse y consultarse sin límite de tiempo; eso no garantiza que los enlaces estén activos para siempre.`;
}

function respuestaPostres() {
  return `🍰 El paquete principal de $${DATOS_NEGOCIO.precio} MXN ya incluye recetarios de postres keto. ${DATOS_NEGOCIO.adicional} es un producto distinto y opcional de $${DATOS_NEGOCIO.upsell} MXN. Puedes adquirir el paquete principal sin comprar el adicional.`;
}

function respuestaOpcional() { return respuestaPostres(); }

const FUNCIONES_INTENCION = {
  precio: respuestaPrecio,
  contenido: respuestaContenido,
  funcionamiento: respuestaFuncionamiento,
  principiantes: respuestaPrincipiantes,
  resultados: respuestaResultados,
  entrega: respuestaEntrega,
  tiempo: respuestaTiempo,
  postpago: respuestaPostpago,
  transferencia: respuestaTransferencia,
  oxxo: respuestaOxxo,
  comprobante: respuestaComprobante,
  rechazado: respuestaRechazado,
  bonos: respuestaBonos,
  acceso: respuestaAcceso,
  formato: respuestaFormato,
  confianza: respuestaConfianza,
  garantia: respuestaGarantia,
  reembolso: respuestaReembolso,
  salud: respuestaSalud,
  soporte: respuestaSoporte
};

// Las palabras principales exactas también sirven como disparadores de texto.
// Para frases naturales se evalúa la necesidad, no solo una palabra incidental.
function respuestaDirecta(mensajeOriginal) {
  const texto = normalizarTexto(mensajeOriginal);
  if (!texto) return null;

  const tiene = (...frases) => contieneAlguna(texto, frases);
  const coincide = (patron) => patron.test(texto);
  const problemaDescrito = coincide(/\b(no (?:puedo|abre|abren|recibi|llego|funciona|me gusto|me gusta|estoy satisfech[oa])|porque|ya que|debido a|archivos? (?:dan|da)|enlace (?:roto|vencido))\b/);
  const pagoRealizado = coincide(/\b(ya (?:pague|pagamos|deposite|transferi)|(?:ya )?(?:hice|realice|efectue) (?:mi |la |el |una |un )?(?:pago|transferencia|deposito)|pago (?:ya |fue |esta )?(?:realizado|hecho|confirmado|validado))\b/);
  const consultaMedica = coincide(/\b(?:salud|diabetes|diabetico|diabetica|hipertension|presion alta|problemas? renales?|enfermedad|medicamentos?|insulina|condicion medica|embarazo|embarazada|lactancia)\b/);
  const sintomas = coincide(/\b(?:hipoglucemia|desmayo|desmayos|dolor (?:de|en el) pecho|dificultad para respirar|falta de aire|confusion|mareos?|vomitos?|glucosa baja)\b/);
  const contextoSalud = sintomas || (consultaMedica && (
    coincide(/\b(?:tengo|soy|padezco|sufro|tomo|uso|utilizo|mi|seguro|segura|adecuado|adecuada|puedo|riesgo|afecta|cura|curar|controla|controlar|trata|tratar|previene|prevenir)\b/) ||
    tiene("si tengo", "para alguien con")
  ));
  const cerrar = (intencion) => {
    let respuesta = FUNCIONES_INTENCION[intencion]();
    if (intencion === "salud") {
      respuesta = respuestaSalud(false);
      if (sintomas) {
        respuesta += "\n\nSi presentas síntomas, consulta a un profesional de salud. Ante desmayo, dificultad para respirar, dolor en el pecho o síntomas graves, busca atención médica urgente. No cambies medicamentos sin supervisión médica.";
      } else {
        respuesta = respuestaSalud();
      }
    }
    // No repetir solicitud de motivo/problema si ya aparece en el mensaje actual.
    if (intencion === "reembolso" && problemaDescrito) {
      respuesta = respuesta.replace(cierrePago("reembolso"), "Puedes solicitar la revisión de tu caso por este mismo WhatsApp.");
    }
    if (intencion === "soporte" && problemaDescrito) {
      respuesta = respuesta.replace(cierrePago("soporte"), "Si aparece un mensaje de error, compártelo por este mismo WhatsApp, sin contraseñas ni códigos de seguridad.");
    }
    // Una consulta posterior al pago no debe terminar ofreciendo otra compra.
    if (pagoRealizado && ["tiempo", "acceso", "formato", "entrega", "garantia"].includes(intencion)) {
      respuesta = FUNCIONES_INTENCION[intencion](false);
    }
    return { intencion, respuesta: limpiarRespuesta(respuesta) };
  };

  if (Object.hasOwn(FUNCIONES_INTENCION, texto)) return cerrar(texto);

  if (coincide(/\b(?:reembolsos?|devolucion|devolver (?:mi |el |tu )?dinero|regresar (?:mi |el )?dinero|quiero mi dinero|cancelar (?:mi |la )?compra|me devuelven)\b/)) return cerrar("reembolso");

  if (coincide(/\b(?:rechazad[oa]s?|rechazaron|no validad[oa]|no (?:aceptaron|reconoce|reconocen|validaron) (?:mi |el )?(?:comprobante|pago)|(?:comprobante|pago) (?:no (?:fue |se )?)validad[oa]|no se valido (?:mi |el )?pago|pago en disputa)\b/)) return cerrar("rechazado");

  if (coincide(/\b(?:soporte|asesor|humano|atencion humana|con quien puedo hablar|hablar con (?:una persona|alguien|un humano)|problemas? (?:con|de) (?:mis |los |el |mi )?(?:archivos|acceso|compra|pago)|no (?:puedo|logro) (?:abrir|descargar|acceder)|me cuesta (?:abrir|descargar|acceder)|no (?:abre|abren) (?:el |los |mi |mis )?(?:pdf|archivos?)|no (?:recibi|me llego|llego) (?:mi |el )?(?:material|paquete|enlace)|enlace (?:roto|vencido)|(?:pdf|archivo) no (?:abre|funciona))\b/) ||
      (tiene("ayuda", "atencion") && coincide(/\b(?:problema|error|compra|pago|archivos?|descarga)\b/))) return cerrar("soporte");

  if (contextoSalud || ["diabetes", "diabetico", "diabetica", "hipertension", "insulina", "medicamentos", "salud"].includes(texto)) return cerrar("salud");

  if (coincide(/\b(?:garantia|garantizado|satisfaccion|no me gusto|no estoy satisfech[oa]|no me gusta|no cumple (?:con )?(?:mis )?expectativas)\b/)) return cerrar("garantia");

  // El estado del pago y el envío de recibos prevalecen sobre el método mencionado.
  if (pagoRealizado) {
    if (coincide(/\b(?:cuando (?:llega|recibo)|cuanto (?:tarda|tardan|demora)|tiempo de entrega)\b/)) return cerrar("tiempo");
    if (coincide(/\b(?:acceso|vigencia|caduca|vence|guardar|conservar|cuanto tiempo)\b/)) return cerrar("acceso");
    if (coincide(/\b(?:pdf|formato|abrir|android|iphone|tablet)\b/)) return cerrar("formato");
    if (coincide(/\b(?:como (?:lo |me )?recibo|como (?:puedo |voy a )?recibir|entrega)\b/)) return cerrar("entrega");
    return cerrar("comprobante");
  }

  if (coincide(/\b(?:comprobantes?|tickets?|ficha de pago|enviar (?:mi |el )?recibo|mandar (?:mi |el )?recibo|recibo de pago|donde mando mi pago)\b/) ||
      (tiene("recibo") && coincide(/\b(?:foto|captura|pago|enviar|mandar|adjuntar)\b/)) || texto === "recibo") return cerrar("comprobante");

  if (coincide(/\b(?:postpago|pagar despues|antes de pagar|primero recibo|sin pagar|pago despues|recibir antes|muestra gratis|muestra gratuita)\b/)) return cerrar("postpago");

  const transferencia = coincide(/\b(?:transferencias?|transferir|transfiero|spei|pago bancario|cuenta bancaria|clabe|datos (?:para|de) transfer(?:ir|encia)|datos bancarios|numero de cuenta)\b/);
  const oxxo = coincide(/\b(?:deposito en oxxo|pagar en oxxo|pago en oxxo|tienda oxxo|(?:pago|pagar) en efectivo|depositar|deposito|oxxo)\b/) &&
    (!tiene("spin by oxxo") || coincide(/\b(?:tienda|efectivo|deposito|depositar)\b/));
  if (transferencia && oxxo && coincide(/\b(?:o|opciones|metodos)\b/)) {
    return { intencion: "pagar", respuesta: respuestaPagar() };
  }
  if (transferencia) return cerrar("transferencia");
  if (oxxo) return cerrar("oxxo");

  if (coincide(/\b(?:cuanto (?:tarda|tardan|demora|demoran)|cuando (?:llega|recibo)|tiempo de entrega|tardan en enviar|es inmediato|cuanto tiempo (?:tarda|tardan|para recibir))\b/)) return cerrar("tiempo");

  // Duración del reto no es duración del acceso a los archivos descargados.
  if (coincide(/\b(?:cuanto (?:tiempo )?dura|duracion (?:del|de mi) reto|duracion del programa)\b/) && !coincide(/\b(?:acceso|enlaces?|archivos?|material|vigencia)\b/)) {
    return { intencion: "duracion", respuesta: respuestaDuracion() };
  }
  if (coincide(/\b(?:acceso|vigencia|caduca(?:n)?|vence(?:n)?|para siempre|pierdo el acceso|puedo descargar|guardar archivos|conservar archivos|despues de los 28 dias|permanente)\b/) ||
      (tiene("duracion", "cuanto tiempo") && coincide(/\b(?:acceso|material|archivos?|consultar|usar|utilizar|enlaces?)\b/)) || texto === "duracion") return cerrar("acceso");

  if (coincide(/\b(?:formato|pdf|abrir archivos|android|iphone|tablet)\b/) ||
      (coincide(/\b(?:celular|telefono|computadora|descargar)\b/) && coincide(/\b(?:abrir|usar|compatible|recetas|archivos?|material|menu|desde|en mi)\b/))) return cerrar("formato");

  if (coincide(/\b(?:entrega|entregan|como (?:lo |me )?(?:recibo|recibir|llega)|como (?:voy a|puedo) recibir(?:lo)?|envian|mandan|recibir (?:mi |el )?(?:material|paquete))\b/)) return cerrar("entrega");

  if (coincide(/\b(?:resultados|cuanto peso|bajar de peso|perder peso|adelgazar|cuantos kilos|cuanto bajo|quemar grasa|sirve para bajar)\b/)) return cerrar("resultados");
  if (coincide(/\b(?:principiantes?|primera vez|sin experiencia|nunca he hecho (?:una dieta )?keto|empezar desde cero)\b/) ||
      (tiene("nuevo", "nueva") && coincide(/\b(?:keto|dieta|reto|programa)\b/))) return cerrar("principiantes");
  if (coincide(/\b(?:funcionamiento|funciona|como se usa|como empiezo|como es el reto)\b/)) return cerrar("funcionamiento");

  if (coincide(/\b(?:bonos?|regalos|extras|obsequios|material adicional|que regalan)\b/)) return cerrar("bonos");

  // Se conserva la consulta adicional, pero "postres" solos no significan upsell.
  if (coincide(/\b(?:postres keto antojos|paquete adicional|complemento opcional|es opcional|es obligatorio|obligatorio|tengo que comprar los postres)\b/) ||
      (tiene("postres") && coincide(/\b(?:obligatori[oa]s?|opcional(?:es)?)\b/))) {
    return { intencion: "upsell_opcional", respuesta: respuestaOpcional() };
  }
  if (tiene("postres")) return { intencion: "postres", respuesta: respuestaPostres() };

  if (coincide(/\b(?:contenido|incluye|incluido|contiene|que recibo)\b/) ||
      (coincide(/\b(?:trae|viene)\b/) && coincide(/\b(?:paquete|programa|reto|material|incluido|incluidos|contenido)\b/))) return cerrar("contenido");

  if (coincide(/\b(?:confianza|estafa|fraude|es confiable|es real|son reales|desconfianza|no me estafen)\b/) ||
      (tiene("seguro", "segura") && coincide(/\b(?:comprar|compra|pagar|pago|aqui|sitio|negocio)\b/))) return cerrar("confianza");

  if (texto === "cuanto es" || coincide(/\b(?:precios?|cuesta|costo|cuanto vale|cuanto dinero)\b/) ||
      (tiene("vale") && coincide(/\b(?:paquete|programa|keto|reto)\b/)) ||
      coincide(/\bcuanto (?:es|sale) (?:el |mi |un )?(?:paquete|programa|reto)\b/)) return cerrar("precio");

  if (coincide(/\b(?:pagar|como pago|metodos de pago|opciones de pago)\b/)) return { intencion: "pagar", respuesta: respuestaPagar() };
  return null;
}

// ==========================================================
// RUTAS
// ==========================================================

app.get("/", (req, res) => {
  return res
    .status(200)
    .send("Alexa - Keto Reset 28 activa ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const mensaje =
      req.body?.texto ??
      req.body?.mensaje ??
      req.body?.message ??
      "";

    const textoUsuario = String(mensaje).trim();

    console.log(
      "Mensaje recibido:",
      textoUsuario ? "[contenido recibido]" : "[vacío]"
    );

    if (!textoUsuario) {
      return res.json({
        respuesta:
          "💚 Estoy aquí para ayudarte 😊 Puedes escribirme tu duda sobre Keto Reset 28."
      });
    }

    const directa = respuestaDirecta(textoUsuario);

    if (directa) {
      const respuestaFinal =
        limpiarRespuesta(directa.respuesta);

      console.log(
        "Intención detectada:",
        directa.intencion
      );

      console.log(
        "Respuesta generada mediante base de conocimiento"
      );

      return res.json({
        respuesta: respuestaFinal
      });
    }

    console.log(
      "Intención detectada: consulta abierta"
    );

    const response =
      await openai.responses.create({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: SYSTEM_PROMPT
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: textoUsuario
              }
            ]
          }
        ]
      });

    const respuestaIA =
      limpiarRespuesta(response.output_text || "");

    console.log(
      "Respuesta generada mediante OpenAI"
    );

    return res.json({
      respuesta:
        respuestaIA ||
        "💚 No pude generar una respuesta en este momento. Inténtalo nuevamente."
    });

  } catch (error) {
    console.error(
      "Error en /mensaje:",
      "No se pudo generar la respuesta; revisa la conectividad y configuración del servicio."
    );

    return res.status(200).json({
      respuesta:
        "💚 En este momento tuve un problema para procesar tu mensaje. Inténtalo nuevamente en unos momentos."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
