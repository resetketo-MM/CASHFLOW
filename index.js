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
- Deja una línea en blanco entre ideas cuando sea necesario.
- Usa emojis con moderación.
- Evita bloques largos de texto.
- No repitas información innecesariamente.
- No saludes nuevamente si la conversación ya comenzó.
- No hagas preguntas innecesarias.
- Responde directamente la duda del usuario.
- No uses Markdown como encabezados con símbolos #.
- No inventes información.
- No inventes enlaces, promociones, descuentos, cuentas,
  garantías, productos, bonos ni condiciones.
- No digas que eres una inteligencia artificial.
- No presiones al usuario para comprar.
- No garantices resultados específicos.
- No garantices una cantidad específica de kilos perdidos.
- No diagnostiques enfermedades.
- No sustituyas las indicaciones de médicos o profesionales
  de nutrición.
- Utiliza exclusivamente la información oficial proporcionada.
- Si no tienes información suficiente para responder algo,
  indica de manera natural que necesitas confirmar ese dato
  con el equipo.
- Si el cliente tiene un problema después de pagar, prioriza
  ayudarlo y no intentes venderle nuevamente.

INFORMACIÓN OFICIAL DEL NEGOCIO:

El producto se llama Keto Reset 28.

Keto Reset 28 es un producto digital organizado para seguirse
durante 28 días.

Incluye una guía, recetas y material práctico para ayudar a
la persona a organizar sus comidas y tener más opciones
durante el proceso.

El precio de Keto Reset 28 es de $79 MXN.

Es un pago único por el programa digital.

Los métodos de pago disponibles son:

- Transferencia bancaria.
- Depósito en OXXO.

Los datos específicos para realizar el pago son gestionados
principalmente mediante el flujo de ManyChat.

Después de realizar el pago, el cliente debe enviar su
comprobante junto con la palabra LISTO para confirmar el pago
y continuar con la entrega de su acceso.

Keto Reset 28 es completamente digital.

Una vez confirmado el pago, el cliente recibe acceso al
material para consultarlo desde su celular.

Los 28 días corresponden a la duración del programa.

Los archivos digitales recibidos pueden conservarse y
consultarse posteriormente.

BONOS:

Con la compra de Keto Reset 28 se incluyen:

- Material de recetas dirigido a personas con diabetes.
- Más de 100 videos internacionales de recetas.

PAQUETE ADICIONAL:

Existe un paquete adicional opcional con un costo de $49 MXN.

Este complemento incluye recetas de postres keto para ofrecer
más opciones cuando aparezca el antojo de algo dulce.

El paquete adicional no es obligatorio.

El cliente puede adquirir únicamente Keto Reset 28 por
$79 MXN sin comprar el complemento.

RESULTADOS:

Los resultados pueden variar de una persona a otra.

Nunca garantices una cantidad específica de kilos perdidos.

Nunca prometas resultados específicos o asegurados.

SALUD:

Si una persona tiene diabetes o utiliza medicamentos para
controlar su glucosa, cualquier cambio importante en su
alimentación debe revisarlo con su médico o profesional de
nutrición.

No asegures que Keto Reset 28 trata, cura, controla o previene
enfermedades.

Cuando respondas una pregunta concreta, no repitas todo el
discurso de venta.

Contesta únicamente lo necesario de manera clara, amable,
ordenada y natural.

OBJETIVO:

Resolver las dudas del cliente de manera breve y útil.

Cuando exista una intención comercial clara, orienta
naturalmente a la persona hacia el siguiente paso de compra.

No agregues cierres comerciales cuando la persona esté
reportando un problema de acceso, una situación médica,
un pago ya realizado o una dificultad con su compra.
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

function debeAgregarCierre(textoNormalizado) {
  return contieneAlguna(textoNormalizado, [
    "precio",
    "incluye",
    "funciona",
    "pagar",
    "postres",
    "opcional"
  ]);
}

function agregarCierre(respuesta, textoNormalizado) {
  const respuestaLimpia = limpiarRespuesta(respuesta);

  if (!respuestaLimpia) {
    return "💚 Estoy aquí para ayudarte con cualquier duda sobre Keto Reset 28.";
  }

  if (!debeAgregarCierre(textoNormalizado)) {
    return respuestaLimpia;
  }

  return `${respuestaLimpia}\n\n${cierreComercial()}`;
}

// ==========================================================
// MENSAJES REUTILIZABLES
// ==========================================================

function respuestaPrecio() {
  return elegirAleatoria([
    `💚 Keto Reset 28 tiene un costo de $${DATOS_NEGOCIO.precio} MXN. Es un pago único por el programa digital.`,
    `💚 El acceso a Keto Reset 28 cuesta $${DATOS_NEGOCIO.precio} MXN y corresponde a un pago único.`,
    `El precio de Keto Reset 28 es de $${DATOS_NEGOCIO.precio} MXN 💚 Es un único pago por el programa digital.`
  ]);
}

function respuestaIncluye() {
  return elegirAleatoria([
    "💚 Keto Reset 28 incluye un programa de alimentación de 28 días con recetas y material práctico para ayudarte a organizar tus comidas y tener más opciones durante el proceso. También recibes los bonos incluidos con tu compra 😊",
    "💚 Recibes un programa digital de 28 días con guía, recetas y material práctico para organizar tus comidas, además de los bonos incluidos con tu compra 😊"
  ]);
}

function respuestaFunciona() {
  return elegirAleatoria([
    "💚 Keto Reset 28 es un programa digital organizado para seguirse durante 28 días. Te brinda una guía y recetas para que tengas más claro qué preparar y puedas organizar mejor tu alimentación durante el proceso 😊",
    "💚 El programa se sigue durante 28 días y te proporciona una guía, recetas e ideas prácticas para ayudarte a organizar tu alimentación paso a paso 😊"
  ]);
}

function respuestaPagar() {
  return elegirAleatoria([
    "💳 Puedes realizar tu pago por transferencia bancaria o depósito en OXXO 😊 Elige la opción que te resulte más cómoda para continuar.",
    "💳 Tenemos dos opciones de pago: transferencia bancaria o depósito en OXXO. Puedes elegir la que prefieras 😊"
  ]);
}

function respuestaComprobante() {
  return elegirAleatoria([
    "💚 Si ya realizaste tu pago, envíanos tu comprobante junto con la palabra LISTO ✅ para confirmar tu pago y continuar con la entrega de tu acceso.",
    "💚 Si tu pago ya está realizado, envía el comprobante junto con la palabra LISTO ✅ para continuar con la confirmación y entrega de tu acceso."
  ]);
}

function respuestaEntrega() {
  return elegirAleatoria([
    "📲 Keto Reset 28 es un producto 100% digital. Una vez confirmado tu pago, recibirás el acceso al material para que puedas consultarlo desde tu celular 😊",
    "📲 Todo el material es digital 😊 Después de confirmar tu pago recibirás el acceso para consultarlo desde tu celular."
  ]);
}

function respuestaDuracion() {
  return elegirAleatoria([
    `🗓️ Keto Reset 28 está organizado para seguirse durante ${DATOS_NEGOCIO.duracion} días, avanzando paso a paso con el material.`,
    `🗓️ El programa tiene una duración de ${DATOS_NEGOCIO.duracion} días y está organizado para que avances paso a paso con el material.`
  ]);
}

function respuestaResultados() {
  return elegirAleatoria([
    "💚 Los resultados pueden variar de una persona a otra, por eso no podemos garantizar una cantidad específica de kilos. Keto Reset 28 te brinda una guía, recetas e ideas para organizar tu alimentación durante los 28 días.",
    "💚 Cada persona puede obtener resultados diferentes. Por eso no garantizamos una cantidad específica de kilos; el programa te proporciona una guía y recetas para organizar tu alimentación durante los 28 días."
  ]);
}

function respuestaDiabetes() {
  return elegirAleatoria([
    "💚 Contamos con material de recetas dirigido a personas con diabetes. Si tienes diabetes o utilizas medicamentos para controlar tu glucosa, cualquier cambio importante en tu alimentación es mejor revisarlo con tu médico o profesional de nutrición.",
    "💚 Entre los bonos hay material de recetas dirigido a personas con diabetes. Si tienes diabetes o tomas medicamentos para controlar tu glucosa, es importante revisar cualquier cambio importante en tu alimentación con tu médico o profesional de nutrición."
  ]);
}

function respuestaBonos() {
  return elegirAleatoria([
    "🎁 Con tu compra recibes material de recetas para personas con diabetes y más de 100 videos internacionales de recetas para tener más ideas y variedad.",
    "🎁 Los bonos incluyen material de recetas dirigido a personas con diabetes y más de 100 videos internacionales de recetas 💚"
  ]);
}

function respuestaPostres() {
  return elegirAleatoria([
    `🍰 El paquete adicional tiene un costo de $${DATOS_NEGOCIO.upsell} MXN e incluye recetas de postres keto para darte más opciones cuando tengas antojo de algo dulce. Es un complemento opcional de Keto Reset 28.`,
    `🍰 Por $${DATOS_NEGOCIO.upsell} MXN puedes agregar el complemento de recetas de postres keto. Es opcional y está pensado para darte más opciones cuando tengas antojo de algo dulce.`
  ]);
}

function respuestaPermanente() {
  return elegirAleatoria([
    "💚 Los 28 días corresponden a la duración del programa, pero los archivos digitales que recibes son tuyos para conservarlos y consultarlos posteriormente.",
    "💚 Sí puedes conservar el material. Los 28 días corresponden al programa, pero tus archivos digitales pueden seguir consultándose después 😊"
  ]);
}

function respuestaAcceso() {
  return elegirAleatoria([
    "💚 Si ya confirmaste tu pago y tienes algún problema para acceder al material, cuéntame qué sucede al intentar abrirlo para poder ayudarte. Si es necesario, se revisará con el equipo 😊",
    "💚 Si tu pago ya fue confirmado pero tienes problemas para abrir el material, dime qué sucede al intentar acceder. Si hace falta, lo revisamos con el equipo 😊"
  ]);
}

function respuestaOpcional() {
  return elegirAleatoria([
    `💚 No. El paquete adicional de $${DATOS_NEGOCIO.upsell} MXN es opcional. Puedes adquirir únicamente Keto Reset 28 por $${DATOS_NEGOCIO.precio} MXN sin agregar el complemento.`,
    `💚 El complemento de $${DATOS_NEGOCIO.upsell} MXN no es obligatorio 😊 Puedes comprar solamente Keto Reset 28 por $${DATOS_NEGOCIO.precio} MXN.`
  ]);
}

function respuestaCuenta() {
  if (
    !DATOS_PAGO.banco ||
    !DATOS_PAGO.titular ||
    !DATOS_PAGO.cuenta
  ) {
    return [
      "💳 Claro 😊 Puedes realizar tu pago por transferencia bancaria.",
      "",
      "Selecciona la opción de transferencia en el flujo de pago para recibir los datos correspondientes."
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

  // --------------------------------------------------------
  // PROBLEMA DE ACCESO
  // --------------------------------------------------------

  if (texto.includes("acceso")) {
    return {
      intencion: "problema_acceso",
      respuesta: respuestaAcceso()
    };
  }

  // --------------------------------------------------------
  // COMPROBANTE / PAGO REALIZADO
  // --------------------------------------------------------

  if (texto.includes("comprobante")) {
    return {
      intencion: "comprobante_pago",
      respuesta: respuestaComprobante()
    };
  }

  // --------------------------------------------------------
  // DIABETES
  // --------------------------------------------------------

  if (texto.includes("diabetes")) {
    return {
      intencion: "diabetes",
      respuesta: respuestaDiabetes()
    };
  }

  // --------------------------------------------------------
  // DATOS DE CUENTA
  // --------------------------------------------------------

  if (texto.includes("cuenta")) {
    return {
      intencion: "datos_cuenta",
      respuesta: respuestaCuenta()
    };
  }

  // --------------------------------------------------------
  // PAQUETE OPCIONAL
  // --------------------------------------------------------

  if (texto.includes("opcional")) {
    return {
      intencion: "upsell_opcional",
      respuesta: agregarCierre(
        respuestaOpcional(),
        texto
      )
    };
  }

  // --------------------------------------------------------
  // POSTRES / COMPLEMENTO
  // --------------------------------------------------------

  if (texto.includes("postres")) {
    return {
      intencion: "upsell_postres",
      respuesta: agregarCierre(
        respuestaPostres(),
        texto
      )
    };
  }

  // --------------------------------------------------------
  // PRECIO
  // --------------------------------------------------------

  if (texto.includes("precio")) {
    return {
      intencion: "precio",
      respuesta: agregarCierre(
        respuestaPrecio(),
        texto
      )
    };
  }

  // --------------------------------------------------------
  // QUÉ INCLUYE
  // --------------------------------------------------------

  if (texto.includes("incluye")) {
    return {
      intencion: "incluye",
      respuesta: agregarCierre(
        respuestaIncluye(),
        texto
      )
    };
  }

  // --------------------------------------------------------
  // CÓMO FUNCIONA
  // --------------------------------------------------------

  if (texto.includes("funciona")) {
    return {
      intencion: "funciona",
      respuesta: agregarCierre(
        respuestaFunciona(),
        texto
      )
    };
  }

  // --------------------------------------------------------
  // FORMAS DE PAGO
  // --------------------------------------------------------

  if (texto.includes("pagar")) {
    return {
      intencion: "forma_pago",
      respuesta: agregarCierre(
        respuestaPagar(),
        texto
      )
    };
  }

  // --------------------------------------------------------
  // ENTREGA
  // --------------------------------------------------------

  if (texto.includes("entrega")) {
    return {
      intencion: "entrega",
      respuesta: respuestaEntrega()
    };
  }

  // --------------------------------------------------------
  // DURACIÓN
  // --------------------------------------------------------

  if (texto.includes("duracion")) {
    return {
      intencion: "duracion",
      respuesta: respuestaDuracion()
    };
  }

  // --------------------------------------------------------
  // RESULTADOS
  // --------------------------------------------------------

  if (texto.includes("resultados")) {
    return {
      intencion: "resultados",
      respuesta: respuestaResultados()
    };
  }

  // --------------------------------------------------------
  // BONOS
  // --------------------------------------------------------

  if (texto.includes("bonos")) {
    return {
      intencion: "bonos",
      respuesta: respuestaBonos()
    };
  }

  // --------------------------------------------------------
  // ACCESO PERMANENTE
  // --------------------------------------------------------

  if (texto.includes("permanente")) {
    return {
      intencion: "acceso_permanente",
      respuesta: respuestaPermanente()
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

    const textoUsuario =
      String(mensaje).trim();

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

    const directa =
      respuestaDirecta(textoUsuario);

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
      response.output_text || "";

    const textoNormalizado =
      normalizarTexto(textoUsuario);

    const respuestaFinal =
      agregarCierre(
        limpiarRespuesta(respuestaIA),
        textoNormalizado
      );

    console.log(
      "Respuesta generada mediante OpenAI"
    );

    return res.json({
      respuesta: respuestaFinal
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
  console.log(
    `Servidor corriendo en puerto ${PORT}`
  );
});
