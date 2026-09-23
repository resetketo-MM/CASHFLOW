require("dotenv").config();

const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 8080;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ==========================================================
// INFORMACIÓN OFICIAL
// ==========================================================

const DATOS_NEGOCIO = {
  nombre: "Keto Reset 28",
  precio: 79,
  duracion: 28,
  upsell: 49
};

const DATOS_PAGO = {
  banco: process.env.BANCO_PAGO,
  titular: process.env.TITULAR_PAGO,
  cuenta: process.env.CUENTA_PAGO
};

// ==========================================================
// PROMPT DEL AGENTE
// ==========================================================

const SYSTEM_PROMPT = `
Eres Alexa, asistente de soporte de Keto Reset 28.

Tu trabajo es responder por WhatsApp las dudas de personas
interesadas o clientes de Keto Reset 28.

Tu personalidad es cercana, amable, clara, paciente, humana
y comercial sin ser insistente.

Responde como una persona real por WhatsApp.

REGLAS DE ESTILO:

- Responde siempre en español.
- Utiliza párrafos cortos.
- Usa emojis con moderación.
- Evita bloques largos de texto.
- No repitas información innecesariamente.
- No saludes nuevamente si la conversación ya comenzó.
- No hagas preguntas innecesarias.
- Responde directamente la duda del usuario.
- No uses encabezados con símbolos #.
- No inventes información.
- No inventes enlaces, promociones, descuentos, cuentas,
  garantías, productos, bonos ni condiciones.
- No digas que eres una inteligencia artificial.
- No presiones a la persona para comprar.
- No garantices resultados específicos.
- No garantices una cantidad específica de kilos perdidos.
- No diagnostiques enfermedades.
- No sustituyas las indicaciones de médicos o profesionales
  de nutrición.
- Si no tienes información suficiente para responder algo,
  indica de manera natural que necesitas confirmar ese dato
  con el equipo.
- Si el cliente tiene un problema después de pagar, prioriza
  ayudarlo y no intentes venderle nuevamente.

INFORMACIÓN OFICIAL DE KETO RESET 28:

Keto Reset 28 es un programa digital organizado para seguirse
durante 28 días.

Incluye una guía, recetas y material práctico para ayudar a
la persona a organizar sus comidas y tener más opciones
durante el proceso.

El precio es de $79 MXN.

Es un pago único por el programa digital.

Los métodos de pago disponibles son:

- Transferencia bancaria.
- Depósito en OXXO.

Después de realizar el pago, el cliente debe enviar su
comprobante junto con la palabra LISTO para confirmar el pago
y continuar con la entrega de su acceso.

Keto Reset 28 es un producto 100% digital.

Una vez confirmado el pago, el cliente recibe acceso al
material para consultarlo desde su celular.

Los 28 días corresponden a la duración del programa.

Los archivos digitales recibidos pueden conservarse y
consultarse posteriormente.

BONOS INCLUIDOS:

- Material de recetas dirigido a personas con diabetes.
- Más de 100 videos internacionales de recetas.

PAQUETE ADICIONAL:

Existe un paquete adicional opcional con un costo de $49 MXN.

Incluye recetas de postres keto para ofrecer más opciones
cuando la persona tenga antojo de algo dulce.

Este paquete es opcional.

La persona puede comprar solamente Keto Reset 28 por $79 MXN
sin adquirir el paquete adicional.

RESULTADOS:

Los resultados pueden variar de una persona a otra.

Nunca garantices una cantidad específica de kilos perdidos.

Nunca prometas resultados específicos o asegurados.

SALUD:

Existe material de recetas dirigido a personas con diabetes.

Si una persona tiene diabetes o utiliza medicamentos para
controlar su glucosa, cualquier cambio importante en su
alimentación debe revisarlo con su médico o profesional de
nutrición.

No asegures que Keto Reset 28 trata, cura, controla o previene
enfermedades.

OBJETIVO:

Resuelve las dudas de manera breve, útil y natural.

Cuando exista una intención comercial clara, puedes orientar
a la persona hacia el siguiente paso de compra.

No agregues cierres comerciales cuando la persona esté
reportando un problema de acceso, una situación de salud,
un pago ya realizado o una dificultad con su compra.

Cuando respondas una pregunta concreta, contesta únicamente
lo necesario y no repitas todo el discurso de venta.
`;

// ==========================================================
// FUNCIONES GENERALES
// ==========================================================

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contieneAlguna(texto, frases) {
  return frases.some((frase) => texto.includes(frase));
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

// ==========================================================
// CIERRES COMERCIALES
// ==========================================================

function cierreComercial() {
  return elegirAleatoria([
    "Si quieres comenzar, puedo indicarte cómo realizar tu pago 😊",
    "Si deseas comenzar con Keto Reset 28, puedo mostrarte las opciones de pago 💚",
    "Si ya quieres comenzar, elige tu método de pago y continuamos 😊"
  ]);
}

function agregarCierre(respuesta) {
  const respuestaLimpia = limpiarRespuesta(respuesta);

  if (!respuestaLimpia) {
    return "💚 Estoy aquí para ayudarte con cualquier duda sobre Keto Reset 28.";
  }

  return `${respuestaLimpia}\n\n${cierreComercial()}`;
}

// ==========================================================
// RESPUESTAS OFICIALES
// ==========================================================

function respuestaPrecio() {
  return [
    `💚 Keto Reset 28 tiene un costo de $${DATOS_NEGOCIO.precio} MXN.`,
    "",
    "Es un pago único por el programa digital."
  ].join("\n");
}

function respuestaIncluye() {
  return [
    "💚 Keto Reset 28 incluye un programa de alimentación de 28 días con recetas y material práctico para ayudarte a organizar tus comidas y tener más opciones durante el proceso.",
    "",
    "También recibes los bonos incluidos con tu compra 😊"
  ].join("\n");
}

function respuestaFunciona() {
  return [
    "💚 Keto Reset 28 es un programa digital organizado para seguirse durante 28 días.",
    "",
    "Te brinda una guía y recetas para que tengas más claro qué preparar y puedas organizar mejor tu alimentación durante el proceso 😊"
  ].join("\n");
}

function respuestaPagar() {
  return [
    "💳 Puedes realizar tu pago por transferencia bancaria o depósito en OXXO.",
    "",
    "Elige la opción que te resulte más cómoda 😊"
  ].join("\n");
}

function respuestaComprobante() {
  return [
    "💚 Si ya realizaste tu pago, envíanos tu comprobante junto con la palabra LISTO ✅",
    "",
    "Así podremos confirmar tu pago y continuar con la entrega de tu acceso."
  ].join("\n");
}

function respuestaEntrega() {
  return [
    "📲 Keto Reset 28 es un producto 100% digital.",
    "",
    "Una vez confirmado tu pago, recibirás el acceso al material para que puedas consultarlo desde tu celular 😊"
  ].join("\n");
}

function respuestaResultados() {
  return [
    "💚 Los resultados pueden variar de una persona a otra, por eso no podemos garantizar una cantidad específica de kilos.",
    "",
    "Keto Reset 28 te brinda una guía, recetas e ideas para organizar tu alimentación durante los 28 días."
  ].join("\n");
}

function respuestaDiabetes() {
  return [
    "💚 Contamos con material de recetas dirigido a personas con diabetes.",
    "",
    "Si tienes diabetes o utilizas medicamentos para controlar tu glucosa, cualquier cambio importante en tu alimentación es mejor revisarlo con tu médico o profesional de nutrición."
  ].join("\n");
}

function respuestaBonos() {
  return [
    "🎁 Con tu compra recibes material de recetas para personas con diabetes y más de 100 videos internacionales de recetas.",
    "",
    "Así tendrás más ideas y variedad durante el proceso 😊"
  ].join("\n");
}

function respuestaPostres() {
  return [
    `🍰 El paquete adicional cuesta $${DATOS_NEGOCIO.upsell} MXN e incluye recetas de postres keto para darte más opciones cuando tengas antojo de algo dulce.`,
    "",
    "Es un complemento opcional de Keto Reset 28."
  ].join("\n");
}

// ==========================================================
// RESPUESTAS ADICIONALES DE ALEXA
// NO NECESITAN KEYWORD PROPIA EN MANYCHAT
// ==========================================================

function respuestaDuracion() {
  return `🗓️ Keto Reset 28 está organizado para seguirse durante ${DATOS_NEGOCIO.duracion} días, avanzando paso a paso con el material.`;
}

function respuestaPermanente() {
  return [
    "💚 Los 28 días corresponden a la duración del programa.",
    "",
    "Los archivos digitales que recibes son tuyos para conservarlos y consultarlos posteriormente."
  ].join("\n");
}

function respuestaAcceso() {
  return [
    "💚 Si ya confirmaste tu pago y tienes algún problema para acceder al material, cuéntame qué sucede al intentar abrirlo para poder ayudarte.",
    "",
    "Si es necesario, se revisará con el equipo 😊"
  ].join("\n");
}

function respuestaOpcional() {
  return [
    `💚 No. El paquete adicional de $${DATOS_NEGOCIO.upsell} MXN es opcional.`,
    "",
    `Puedes adquirir únicamente Keto Reset 28 por $${DATOS_NEGOCIO.precio} MXN sin agregar el complemento.`
  ].join("\n");
}

function respuestaCuenta() {
  if (
    !DATOS_PAGO.banco ||
    !DATOS_PAGO.titular ||
    !DATOS_PAGO.cuenta
  ) {
    return [
      "💳 Puedes realizar tu pago por transferencia bancaria.",
      "",
      "Selecciona la opción de transferencia en el flujo de pago para recibir los datos correspondientes 😊"
    ].join("\n");
  }

  return [
    "💳 Claro 😊 Estos son los datos para realizar tu transferencia:",
    "",
    `🏦 Entidad financiera: ${DATOS_PAGO.banco}`,
    `👤 Titular: ${DATOS_PAGO.titular}`,
    `🔢 Cuenta: ${DATOS_PAGO.cuenta}`,
    "",
    "Cuando termines, envía tu comprobante junto con la palabra LISTO ✅"
  ].join("\n");
}

// ==========================================================
// RESPUESTAS DIRECTAS
// ==========================================================

function respuestaDirecta(mensajeOriginal) {
  const texto = normalizarTexto(mensajeOriginal);

  if (!texto) {
    return null;
  }

  // 10 KEYWORDS PRINCIPALES DE MANYCHAT

  if (texto.includes("precio")) {
    return {
      intencion: "precio",
      respuesta: agregarCierre(respuestaPrecio())
    };
  }

  if (texto.includes("incluye")) {
    return {
      intencion: "incluye",
      respuesta: agregarCierre(respuestaIncluye())
    };
  }

  if (texto.includes("funciona")) {
    return {
      intencion: "funciona",
      respuesta: agregarCierre(respuestaFunciona())
    };
  }

  if (texto.includes("pagar")) {
    return {
      intencion: "pagar",
      respuesta: agregarCierre(respuestaPagar())
    };
  }

  if (texto.includes("comprobante")) {
    return {
      intencion: "comprobante",
      respuesta: respuestaComprobante()
    };
  }

  if (texto.includes("entrega")) {
    return {
      intencion: "entrega",
      respuesta: respuestaEntrega()
    };
  }

  if (texto.includes("resultados")) {
    return {
      intencion: "resultados",
      respuesta: respuestaResultados()
    };
  }

  if (texto.includes("diabetes")) {
    return {
      intencion: "diabetes",
      respuesta: respuestaDiabetes()
    };
  }

  if (texto.includes("bonos")) {
    return {
      intencion: "bonos",
      respuesta: respuestaBonos()
    };
  }

  if (texto.includes("postres")) {
    return {
      intencion: "postres",
      respuesta: agregarCierre(respuestaPostres())
    };
  }

  // RESPUESTAS INTERNAS ADICIONALES DE ALEXA

  if (contieneAlguna(texto, [
    "cuanto dura",
    "duracion",
    "28 dias"
  ])) {
    return {
      intencion: "duracion",
      respuesta: respuestaDuracion()
    };
  }

  if (contieneAlguna(texto, [
    "para siempre",
    "permanente",
    "despues de los 28 dias",
    "conservar archivos"
  ])) {
    return {
      intencion: "permanente",
      respuesta: respuestaPermanente()
    };
  }

  if (contieneAlguna(texto, [
    "no puedo abrir",
    "problema de acceso",
    "no puedo acceder",
    "no abre"
  ])) {
    return {
      intencion: "problema_acceso",
      respuesta: respuestaAcceso()
    };
  }

  if (contieneAlguna(texto, [
    "es opcional",
    "es obligatorio",
    "tengo que comprar los postres",
    "obligatorio"
  ])) {
    return {
      intencion: "upsell_opcional",
      respuesta: respuestaOpcional()
    };
  }

  if (contieneAlguna(texto, [
    "numero de cuenta",
    "datos bancarios",
    "datos de transferencia",
    "clabe",
    "cuenta bancaria",
    "donde transfiero"
  ])) {
    return {
      intencion: "datos_pago",
      respuesta: respuestaCuenta()
    };
  }

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
      error?.message || "Error desconocido"
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
