from llama_cpp import Llama

# Inicializar modelo una sola vez (singleton pattern)
modelo = Llama(
    model_path="C:/Users/nder1/Downloads/modeloIA/Llama-3.2-3B-Instruct-Q4_0.gguf",
    n_threads=8,
    n_ctx=16384,
    n_batch=128,
    n_gpu_layers=20,
    verbose=False
)

def generar_respuesta(prompt: str, max_tokens: int = 400, temperature: float = 0.6) -> str:
    """Función genérica para consultar al modelo."""
    try:
        salida = modelo(
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=0.9,
            stop=["</s>", "Usuario:", "###"]
        )
        return salida["choices"][0]["text"].strip()
    except Exception as e:
        return f"⚠️ Error al generar respuesta: {e}"

def analizar_inventario(productos: str) -> str:
    prompt = f"""
Eres un experto en gestión de inventarios.
Responde SIEMPRE en español, de forma clara, concisa y estructurada.

Tengo los siguientes productos:

{productos}

Responde ÚNICAMENTE en este formato (no incluyas nada más):

1. Productos que necesitan reabastecimiento urgente (stock bajo):
   - Producto: diferencia_stock
2. Productos recomendados para promocionar (alta rotación):
   - Producto
3. Alertas de exceso de stock:
   - Producto: exceso_stock
4. Recomendaciones generales de gestión:
   - Texto breve con sugerencias
"""
    return generar_respuesta(prompt, max_tokens=600, temperature=0.4)


def chat_con_ia(mensaje: str, productos: list) -> str:
    if productos:
        productos_texto = "\n".join([
            f"- {p['nombre']}: Stock {p['stock']}, Precio ${p['precio']}, Ventas 7d: {p['ventas']}"
            for p in productos
        ])
        contexto = f"Inventario actual del usuario:\n{productos_texto}\n\n"
    else:
        contexto = "El usuario no tiene productos en el inventario actualmente.\n\n"
    
    prompt = f"""
Eres un asistente especializado en gestión de inventarios. 
Responde en español de manera conversacional y útil.
Cuando el usuario haga preguntas complejas, responde con explicaciones largas, 
claras y detalladas (mínimo 4 párrafos).

{contexto}
Usuario: {mensaje}

Asistente:
"""
    return generar_respuesta(prompt, max_tokens=1200, temperature=0.7)
