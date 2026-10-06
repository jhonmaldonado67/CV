import flet as ft
import json
from IA import analizar_inventario, chat_con_ia
import time

ARCHIVO_DATOS = "datos.json"

def cargar_datos():
    try:
        with open(ARCHIVO_DATOS, "r") as f:
            return json.load(f)
    except:
        return []

def guardar_datos(productos):
    with open(ARCHIVO_DATOS, "w") as f:
        json.dump(productos, f, indent=2)

def main(page: ft.Page):
    # Configuración de la página - NUEVA PALETA DE COLORES ARMONIOSA
    page.title = "InventAI - Gestión Inteligente"
    page.theme_mode = ft.ThemeMode.LIGHT
    page.padding = 0
    page.scroll = ft.ScrollMode.AUTO
    
    # NUEVA PALETA DE COLORES ARMONIOSA - TONOS TERROSOS Y NATURALES
    PRIMARY_COLOR = "#2d4cc8"    # Azul profesional
    SECONDARY_COLOR = "#6b7280"   # Gris neutro
    ACCENT_COLOR = "#059669"      # Verde esmeralda
    SUCCESS_COLOR = "#10b981"     # Verde éxito
    WARNING_COLOR = "#f59e0b"     # Ámbar
    DANGER_COLOR = "#dc2626"      # Rojo coral
    LIGHT_BG = "#f8fafc"          # Fondo claro
    CARD_BG = "#ffffff"           # Fondo tarjetas
    NAVBAR_BG = "#1e293b"         # Fondo barra superior oscuro
    NAVBAR_TEXT = "#f1f5f9"       # Texto barra superior
    
    page.bgcolor = LIGHT_BG
    page.fonts = {
        "Inter": "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
    }
    page.theme = ft.Theme(font_family="Inter")
    
    productos = cargar_datos()

    # Campos de entrada con diseño mejorado
    def create_text_field(label, icon, keyboard_type=ft.KeyboardType.TEXT):
        return ft.TextField(
            label=label,
            border_radius=12,
            filled=True,
            border_color="transparent",
            bgcolor=f"{PRIMARY_COLOR}08",
            prefix_icon=icon,
            keyboard_type=keyboard_type,
            content_padding=16,
            text_size=14,
            label_style=ft.TextStyle(color=SECONDARY_COLOR, weight=ft.FontWeight.W_500),
            cursor_color=PRIMARY_COLOR,
            focused_border_color=PRIMARY_COLOR,
            focused_bgcolor=f"{PRIMARY_COLOR}0C",
        )
    
    nombre = create_text_field("Nombre del producto", ft.Icons.INVENTORY_2)
    categoria = create_text_field("Categoría", ft.Icons.CATEGORY)
    proveedor = create_text_field("Proveedor", ft.Icons.BUSINESS)
    precio = create_text_field("Precio ($)", ft.Icons.ATTACH_MONEY, ft.KeyboardType.NUMBER)
    stock = create_text_field("Stock actual", ft.Icons.INVENTORY, ft.KeyboardType.NUMBER)
    ventas = create_text_field("Ventas últimos 7 días", ft.Icons.TRENDING_UP, ft.KeyboardType.NUMBER)

    lista_productos = ft.Column(spacing=12)
    resultado_ia = ft.Column(spacing=12)
    
    # Variables para el chat
    mensajes_chat = ft.Column(scroll=ft.ScrollMode.AUTO, expand=True)
    input_mensaje = ft.TextField(
        label="Escribe tu mensaje...",
        border_radius=12,
        filled=True,
        border_color="transparent",
        bgcolor=f"{PRIMARY_COLOR}08",
        content_padding=16,
        text_size=14,
        cursor_color=PRIMARY_COLOR,
        focused_border_color=PRIMARY_COLOR,
        focused_bgcolor=f"{PRIMARY_COLOR}0C",
        on_submit=lambda e: enviar_mensaje_chat(e),
        expand=True,
    )
    
    # BARRA DE NAVEGACIÓN SUPERIOR MEJORADA
    nav_items = [
        {"icon": ft.Icons.DASHBOARD, "label": "Dashboard", "route": "/"},
        {"icon": ft.Icons.INVENTORY_2, "label": "Inventario", "route": "/inventario"},
        {"icon": ft.Icons.SHOPPING_BAG, "label": "Productos", "route": "/productos"},
        {"icon": ft.Icons.ANALYTICS, "label": "Análisis IA", "route": "/ia"},
        {"icon": ft.Icons.CHAT, "label": "Chat IA", "route": "/chat"},
    ]
    
    # Función para crear elementos de navegación superiores
    def create_nav_item(icon, label, route, is_selected=False):
        return ft.Container(
            content=ft.Column([
                ft.Icon(icon, color=NAVBAR_TEXT if is_selected else f"{NAVBAR_TEXT}80", size=20),
                ft.Text(label, size=12, color=NAVBAR_TEXT if is_selected else f"{NAVBAR_TEXT}80", 
                       weight=ft.FontWeight.W_500),
            ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=4),
            padding=16,
            border_radius=8,
            bgcolor=f"{PRIMARY_COLOR}30" if is_selected else "transparent",
            on_click=lambda e: page.go(route),
            data=route,
            on_hover=lambda e: on_nav_hover(e, route),
            width=100,
        )
    
    # Función para manejar el efecto hover en la navegación superior
    def on_nav_hover(e, route):
        if e.data == "true" and page.route != route:
            e.control.bgcolor = f"{PRIMARY_COLOR}20"
        else:
            e.control.bgcolor = f"{PRIMARY_COLOR}30" if page.route == route else "transparent"
        e.control.update()
    
    # Barra de navegación superior
    top_navigation = ft.Container(
        content=ft.Row([
            # Logo y título
            ft.Row([
                ft.Container(
                    content=ft.Icon(ft.Icons.INVENTORY, color=NAVBAR_TEXT, size=28),
                    bgcolor=PRIMARY_COLOR,
                    padding=10,
                    border_radius=10,
                ),
                ft.Column([
                    ft.Text("InventAI", size=18, weight=ft.FontWeight.BOLD, color=NAVBAR_TEXT),
                    ft.Text("Sistema Inteligente", size=10, color=f"{NAVBAR_TEXT}80"),
                ], spacing=0),
            ], spacing=12),
            
            ft.Container(expand=True),
            
            # Items de navegación
            ft.Row([
                create_nav_item(item["icon"], item["label"], item["route"], page.route == item["route"])
                for item in nav_items
            ], spacing=0),
            
            ft.Container(expand=True),
            
            # Estadísticas rápidas
            ft.Row([
                ft.Container(
                    content=ft.Column([
                        ft.Text(str(len(productos)), size=16, weight=ft.FontWeight.BOLD, color=NAVBAR_TEXT),
                        ft.Text("Productos", size=10, color=f"{NAVBAR_TEXT}80"),
                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=2),
                    padding=10,
                ),
                ft.VerticalDivider(width=1, color=f"{NAVBAR_TEXT}30"),
                ft.Container(
                    content=ft.Column([
                        ft.Text(str(sum(p['stock'] for p in productos)), size=16, weight=ft.FontWeight.BOLD, color=ACCENT_COLOR),
                        ft.Text("En Stock", size=10, color=f"{NAVBAR_TEXT}80"),
                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=2),
                    padding=10,
                ),
            ], spacing=0),
        ], alignment=ft.MainAxisAlignment.START),
        bgcolor=NAVBAR_BG,
        padding=ft.padding.symmetric(horizontal=20, vertical=12),
        shadow=ft.BoxShadow(
            spread_radius=1,
            blur_radius=15,
            color=ft.Colors.with_opacity(0.2, ft.Colors.BLACK),
            offset=ft.Offset(0, 2),
        ),
    )
    
    # Card de estadísticas MEJORADA
    def crear_stat_card(titulo, valor, icono, color, subtexto=""):
        return ft.Container(
            content=ft.Column([
                ft.Row([
                    ft.Container(
                        content=ft.Icon(icono, color="white", size=18),
                        bgcolor=color,
                        padding=10,
                        border_radius=8,
                    ),
                    ft.Column([
                        ft.Text(titulo, size=12, color=SECONDARY_COLOR, weight=ft.FontWeight.W_500),
                        ft.Text(str(valor), size=22, weight=ft.FontWeight.BOLD, color=color),
                        ft.Text(subtexto, size=10, color=SECONDARY_COLOR) if subtexto else ft.Container(),
                    ], spacing=2, expand=True),
                ], spacing=12),
            ]),
            bgcolor=CARD_BG,
            border_radius=16,
            padding=20,
            height=100,
            expand=True,
            shadow=ft.BoxShadow(
                spread_radius=1,
                blur_radius=15,
                color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK),
                offset=ft.Offset(0, 2),
            ),
            on_hover=lambda e: on_card_hover(e),
        )
    
    # Función para manejar el efecto hover en las tarjetas
    def on_card_hover(e):
        if e.data == "true":
            e.control.shadow = ft.BoxShadow(
                spread_radius=2,
                blur_radius=20,
                color=ft.Colors.with_opacity(0.12, ft.Colors.BLACK),
                offset=ft.Offset(0, 4),
            )
        else:
            e.control.shadow = ft.BoxShadow(
                spread_radius=1,
                blur_radius=15,
                color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK),
                offset=ft.Offset(0, 2),
            )
        e.control.update()

    def mostrar_mensaje(mensaje, tipo="info"):
        color = {
            "success": SUCCESS_COLOR,
            "warning": WARNING_COLOR,
            "error": DANGER_COLOR,
            "info": PRIMARY_COLOR
        }.get(tipo, PRIMARY_COLOR)
        
        snack_bar = ft.SnackBar(
            content=ft.Row([
                ft.Icon(ft.Icons.CHECK_CIRCLE if tipo == "success" else 
                       ft.Icons.WARNING if tipo == "warning" else 
                       ft.Icons.ERROR if tipo == "error" else 
                       ft.Icons.INFO, color=ft.Colors.WHITE),
                ft.Text(mensaje, color=ft.Colors.WHITE, weight=ft.FontWeight.W_500),
            ], spacing=10),
            bgcolor=color,
            behavior=ft.SnackBarBehavior.FLOATING,
            margin=15,
            elevation=10,
            shape=ft.RoundedRectangleBorder(radius=10),
            padding=15,
        )
        page.snack_bar = snack_bar
        snack_bar.open = True
        page.update()

    def validar_campos():
        if not all([nombre.value, categoria.value, proveedor.value, precio.value, stock.value, ventas.value]):
            mostrar_mensaje("Por favor, complete todos los campos", "warning")
            return False
        try:
            float(precio.value)
            int(stock.value)
            int(ventas.value)
            return True
        except ValueError:
            mostrar_mensaje("Precio, stock y ventas deben ser números válidos", "error")
            return False

    def agregar_producto(e):
        if not validar_campos():
            return
        producto = {
            "nombre": nombre.value,
            "categoria": categoria.value,
            "proveedor": proveedor.value,
            "precio": float(precio.value),
            "stock": int(stock.value),
            "ventas": int(ventas.value)
        }
        productos.append(producto)
        guardar_datos(productos)
        mostrar_mensaje("✅ Producto agregado exitosamente", "success")
        limpiar_campos()
        actualizar_lista()

    def limpiar_campos():
        nombre.value = categoria.value = proveedor.value = precio.value = stock.value = ventas.value = ""
        page.update()

    def eliminar_producto(index):
        def confirmar_eliminacion(e):
            productos.pop(index)
            guardar_datos(productos)
            actualizar_lista()
            mostrar_mensaje("🗑️ Producto eliminado", "info")
            page.close(dialog)
        
        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Confirmar eliminación", weight=ft.FontWeight.BOLD),
            content=ft.Text("¿Estás seguro de que deseas eliminar este producto?"),
            actions=[
                ft.TextButton("Cancelar", 
                            style=ft.ButtonStyle(color=SECONDARY_COLOR),
                            on_click=lambda e: page.close(dialog)),
                ft.TextButton("Eliminar", 
                            style=ft.ButtonStyle(color=DANGER_COLOR),
                            on_click=confirmar_eliminacion),
            ],
            actions_alignment=ft.MainAxisAlignment.END,
            shape=ft.RoundedRectangleBorder(radius=12),
        )
        page.open(dialog)

    def actualizar_lista():
        lista_productos.controls.clear()
        if not productos:
            lista_productos.controls.append(
                ft.Container(
                    content=ft.Column([
                        ft.Icon(ft.Icons.INVENTORY_2_OUTLINED, size=48, color=f"{SECONDARY_COLOR}60"),
                        ft.Text("No hay productos", size=16, color=SECONDARY_COLOR, weight=ft.FontWeight.W_600),
                        ft.Text("Agrega tu primer producto para comenzar", size=12, color=f"{SECONDARY_COLOR}70"),
                    ], horizontal_alignment=ft.CrossAxisAlignment.CENTER, spacing=8),
                    alignment=ft.alignment.center,
                    padding=40,
                    bgcolor=CARD_BG,
                    border_radius=16,
                    on_hover=lambda e: on_card_hover(e),
                )
            )
        else:
            for i, p in enumerate(productos):
                stock_color = SUCCESS_COLOR if p['stock'] > 10 else WARNING_COLOR if p['stock'] > 0 else DANGER_COLOR
                
                def on_product_card_hover(e, card_index=i):
                    if e.data == "true":
                        e.control.shadow = ft.BoxShadow(
                            spread_radius=2,
                            blur_radius=20,
                            color=ft.Colors.with_opacity(0.12, ft.Colors.BLACK),
                            offset=ft.Offset(0, 4),
                        )
                    else:
                        e.control.shadow = ft.BoxShadow(
                            spread_radius=1,
                            blur_radius=12,
                            color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK),
                            offset=ft.Offset(0, 2),
                        )
                    e.control.update()
                
                card = ft.Container(
                    content=ft.Row([
                        ft.Container(
                            expand=True,
                            content=ft.Column([
                                ft.Text(p['nombre'], size=15, weight=ft.FontWeight.BOLD, color=SECONDARY_COLOR),
                                ft.Text(f"{p['categoria']} • {p['proveedor']}", size=12, color=f"{SECONDARY_COLOR}70"),
                                ft.Row([
                                    ft.Container(
                                        content=ft.Text(f"${p['precio']:.2f}", size=11, color=ft.Colors.WHITE, weight=ft.FontWeight.W_600),
                                        bgcolor=PRIMARY_COLOR, 
                                        padding=ft.padding.symmetric(horizontal=10, vertical=4), 
                                        border_radius=6
                                    ),
                                    ft.Container(
                                        content=ft.Text(f"Stock: {p['stock']}", size=11, color=ft.Colors.WHITE, weight=ft.FontWeight.W_600),
                                        bgcolor=stock_color, 
                                        padding=ft.padding.symmetric(horizontal=10, vertical=4), 
                                        border_radius=6
                                    ),
                                    ft.Container(
                                        content=ft.Text(f"Ventas: {p['ventas']}", size=11, color=ft.Colors.WHITE, weight=ft.FontWeight.W_600),
                                        bgcolor=ACCENT_COLOR, 
                                        padding=ft.padding.symmetric(horizontal=10, vertical=4), 
                                        border_radius=6
                                    ),
                                ], spacing=6),
                            ], spacing=6)
                        ),
                        ft.IconButton(
                            icon=ft.Icons.DELETE_OUTLINE, 
                            icon_color=f"{SECONDARY_COLOR}60",
                            icon_size=20,
                            tooltip="Eliminar producto", 
                            on_click=lambda e, idx=i: eliminar_producto(idx),
                            style=ft.ButtonStyle(
                                shape=ft.RoundedRectangleBorder(radius=8),
                                side=ft.BorderSide(1, f"{SECONDARY_COLOR}20")
                            ),
                            on_hover=lambda e: on_icon_hover(e),
                        ),
                    ]),
                    bgcolor=CARD_BG,
                    border_radius=14,
                    padding=16,
                    margin=ft.margin.only(bottom=8),
                    shadow=ft.BoxShadow(
                        spread_radius=1, 
                        blur_radius=12, 
                        color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK), 
                        offset=ft.Offset(0, 2)
                    ),
                    on_hover=on_product_card_hover,
                )
                lista_productos.controls.append(card)
        page.update()
    
    # Función para manejar el hover en los iconos
    def on_icon_hover(e):
        if e.data == "true":
            e.control.icon_color = DANGER_COLOR
            e.control.bgcolor = f"{DANGER_COLOR}15"
        else:
            e.control.icon_color = f"{SECONDARY_COLOR}60"
            e.control.bgcolor = None
        e.control.update()

    def obtener_estadisticas():
        return {
            'total_productos': len(productos),
            'stock_total': sum(p['stock'] for p in productos),
            'ventas_totales': sum(p['ventas'] for p in productos),
            'stock_bajo': sum(1 for p in productos if p['stock'] < 5)
        }

    def analizar(e):
        if not productos:
            mostrar_mensaje("No hay productos para analizar", "warning")
            return
        
        productos_texto = "\n".join([f"- {p['nombre']}: Stock {p['stock']}, Ventas últimos 7 días: {p['ventas']}" for p in productos])
        resultado_ia.controls.clear()
        
        resultado_ia.controls.append(
            ft.Container(
                content=ft.Row([
                    ft.ProgressRing(width=20, height=20, color=PRIMARY_COLOR, stroke_width=2),
                    ft.Column([
                        ft.Text("Analizando inventario", size=14, weight=ft.FontWeight.W_600, color=SECONDARY_COLOR),
                        ft.Text("La IA está procesando tus datos...", size=12, color=f"{SECONDARY_COLOR}70"),
                    ], spacing=2),
                ], spacing=12),
                padding=20,
                bgcolor=CARD_BG,
                border_radius=14,
                on_hover=lambda e: on_card_hover(e),
            )
        )
        page.update()
        
        try:
            respuesta = analizar_inventario(productos_texto)
            resultado_ia.controls.clear()
            resultado_ia.controls.append(
                ft.Container(
                    content=ft.Column([
                        ft.Row([
                            ft.Icon(ft.Icons.ANALYTICS, color=PRIMARY_COLOR, size=20),
                            ft.Text("Análisis de IA", size=16, weight=ft.FontWeight.BOLD, color=PRIMARY_COLOR),
                        ], spacing=10),
                        ft.Divider(height=1, color=f"{SECONDARY_COLOR}20"),
                        ft.Container(
                            content=ft.Text(respuesta, size=13, color=SECONDARY_COLOR, selectable=True),
                            padding=12,
                            bgcolor=f"{PRIMARY_COLOR}05",
                            border_radius=10,
                        ),
                    ], spacing=12),
                    bgcolor=CARD_BG, 
                    border_radius=16, 
                    padding=20,
                    shadow=ft.BoxShadow(
                        spread_radius=1, 
                        blur_radius=12, 
                        color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK), 
                        offset=ft.Offset(0, 2)
                    ),
                    on_hover=lambda e: on_card_hover(e),
                )
            )
        except Exception as e:
            resultado_ia.controls.clear()
            resultado_ia.controls.append(
                ft.Container(
                    content=ft.Row([
                        ft.Icon(ft.Icons.ERROR_OUTLINE, color=DANGER_COLOR, size=20),
                        ft.Column([
                            ft.Text("Error en el análisis", size=14, weight=ft.FontWeight.W_600, color=DANGER_COLOR),
                            ft.Text(f"Detalles: {str(e)}", size=12, color=SECONDARY_COLOR),
                        ], spacing=2),
                    ], spacing=10), 
                    bgcolor=CARD_BG, 
                    border_radius=14, 
                    padding=16,
                    on_hover=lambda e: on_card_hover(e),
                )
            )
        page.update()

    # Funciones para el chat con IA
    def enviar_mensaje_chat(e=None):
        if not input_mensaje.value.strip():
            return
        
        mensaje_usuario = input_mensaje.value.strip()
        agregar_mensaje_chat(mensaje_usuario, es_usuario=True)
        input_mensaje.value = ""
        page.update()
        
        indicador_escribiendo = ft.Container(
            content=ft.Row([
                ft.ProgressRing(width=16, height=16, color=ACCENT_COLOR),
                ft.Text("IA está escribiendo...", size=12, color=SECONDARY_COLOR)
            ], spacing=8),
            padding=12,
        )
        mensajes_chat.controls.append(indicador_escribiendo)
        page.update()
        
        try:
            respuesta = chat_con_ia(mensaje_usuario, productos)
            mensajes_chat.controls.pop()
            agregar_mensaje_chat(respuesta, es_usuario=False)
        except Exception as ex:
            mensajes_chat.controls.pop()
            agregar_mensaje_chat(f"Error al comunicarse con la IA: {str(ex)}", es_usuario=False)

    def agregar_mensaje_chat(mensaje, es_usuario=True):
        bubble_color = PRIMARY_COLOR if es_usuario else ACCENT_COLOR
        mensajes_chat.controls.append(
            ft.Container(
                content=ft.Row([
                    ft.Container(
                        content=ft.Icon(ft.Icons.PERSON if es_usuario else ft.Icons.SMART_TOY, 
                                       color="white", size=16),
                        bgcolor=bubble_color,
                        padding=8,
                        border_radius=10,
                    ),
                    ft.Column([
                        ft.Text("Tú" if es_usuario else "Asistente IA", 
                               size=12, 
                               weight=ft.FontWeight.W_600,
                               color=bubble_color),
                        ft.Container(
                            content=ft.Text(mensaje, size=13, color=SECONDARY_COLOR, selectable=True),
                            padding=10,
                            bgcolor=f"{bubble_color}08",
                            border_radius=10,
                        ),
                    ], spacing=4, expand=True),
                ], spacing=10),
                padding=6,
            )
        )
        if page.route == "/chat":
            page.update()
            time.sleep(0.1)
            mensajes_chat.scroll_to(offset=-1, duration=300)

    def crear_header(titulo, subtitulo=""):
        return ft.Container(
            content=ft.Column([
                ft.Text(titulo, size=24, weight=ft.FontWeight.BOLD, color=NAVBAR_BG),
                ft.Text(subtitulo, size=14, color=SECONDARY_COLOR, weight=ft.FontWeight.W_500) if subtitulo else ft.Container()
            ], spacing=4), 
            padding=ft.padding.only(bottom=20)
        )

    def crear_boton_principal(texto, icono, on_click, color=PRIMARY_COLOR, expand=False):
        def on_button_hover(e):
            if e.data == "true":
                e.control.bgcolor = ft.Colors.with_opacity(0.9, color)
            else:
                e.control.bgcolor = color
            e.control.update()
        
        return ft.Container(
            content=ft.FilledButton(
                content=ft.Row([
                    ft.Icon(icono, color=ft.Colors.WHITE, size=18),
                    ft.Text(texto, color=ft.Colors.WHITE, size=13, weight=ft.FontWeight.W_600),
                ], spacing=8, alignment=ft.MainAxisAlignment.CENTER),
                on_click=on_click,
                style=ft.ButtonStyle(
                    bgcolor=color,
                    padding=ft.padding.symmetric(horizontal=20, vertical=14),
                    shape=ft.RoundedRectangleBorder(radius=10),
                ),
                on_hover=on_button_hover,
            ),
            margin=ft.margin.only(bottom=10),
            expand=expand
        )

    # Contenedor principal de contenido
    content_container = ft.Container(
        padding=25,
        expand=True,
        bgcolor=LIGHT_BG,
    )

    # Páginas ACTUALIZADAS
    def pagina_principal(route):
        stats = obtener_estadisticas()
        content_container.content = ft.Column([
            crear_header("Dashboard Principal", "Visión general de tu inventario"),
            
            ft.Container(
                content=ft.Column([
                    ft.Text("Métricas del Inventario", size=18, weight=ft.FontWeight.BOLD, color=NAVBAR_BG),
                    ft.Row([
                        crear_stat_card("Total Productos", stats['total_productos'], ft.Icons.INVENTORY, PRIMARY_COLOR),
                        crear_stat_card("Stock Total", stats['stock_total'], ft.Icons.INVENTORY_2, SUCCESS_COLOR, "unidades"),
                        crear_stat_card("Ventas 7d", stats['ventas_totales'], ft.Icons.TRENDING_UP, ACCENT_COLOR, "ventas"),
                        crear_stat_card("Stock Bajo", stats['stock_bajo'], ft.Icons.WARNING, WARNING_COLOR, "alertas"),
                    ], spacing=15),
                ], spacing=15),
                bgcolor=CARD_BG,
                padding=20,
                border_radius=16,
                margin=ft.margin.only(bottom=20),
            ),
            
            ft.Text("Acciones Rápidas", size=18, weight=ft.FontWeight.BOLD, color=NAVBAR_BG),
            ft.Row([
                crear_boton_principal("Agregar Producto", ft.Icons.ADD, lambda e: page.go("/inventario"), PRIMARY_COLOR, expand=True),
                crear_boton_principal("Ver Productos", ft.Icons.LIST_ALT, lambda e: page.go("/productos"), ACCENT_COLOR, expand=True),
                crear_boton_principal("Analizar con IA", ft.Icons.ANALYTICS, lambda e: page.go("/ia"), SUCCESS_COLOR, expand=True),
            ], spacing=10),
        ], scroll=ft.ScrollMode.AUTO, expand=True)
        page.update()

    def pagina_inventario(route):
        content_container.content = ft.Column([
            crear_header("Gestión de Inventario", "Agrega y gestiona productos del sistema"),
            
            ft.Container(
                content=ft.Column([
                    ft.Row([
                        ft.Icon(ft.Icons.ADD_BOX, color=PRIMARY_COLOR, size=22),
                        ft.Text("Agregar Nuevo Producto", size=18, weight=ft.FontWeight.BOLD, color=NAVBAR_BG),
                    ], spacing=10),
                    ft.Divider(height=1, color=f"{SECONDARY_COLOR}20"),
                    ft.Row([nombre, categoria], spacing=15),
                    ft.Row([proveedor, precio], spacing=15),
                    ft.Row([stock, ventas], spacing=15),
                    ft.Row([
                        crear_boton_principal("Agregar Producto", ft.Icons.CHECK, agregar_producto, SUCCESS_COLOR),
                        ft.OutlinedButton(
                            content=ft.Row([
                                ft.Icon(ft.Icons.CLEAR, size=16),
                                ft.Text("Limpiar Campos", size=13, weight=ft.FontWeight.W_500),
                            ], spacing=6),
                            on_click=lambda e: limpiar_campos(),
                            style=ft.ButtonStyle(
                                shape=ft.RoundedRectangleBorder(radius=10),
                                padding=ft.padding.symmetric(horizontal=18, vertical=12),
                            ),
                        ),
                    ], spacing=10),
                ], spacing=15),
                bgcolor=CARD_BG, 
                border_radius=16, 
                padding=20,
                margin=ft.margin.only(bottom=20),
                shadow=ft.BoxShadow(
                    spread_radius=1, 
                    blur_radius=12, 
                    color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK), 
                    offset=ft.Offset(0, 2)
                ),
                on_hover=lambda e: on_card_hover(e),
            ),
        ], scroll=ft.ScrollMode.AUTO, expand=True)
        page.update()

    def pagina_productos(route):
        content_container.content = ft.Column([
            crear_header("Gestión de Productos", "Consulta y administra tu inventario"),
            
            ft.Container(
                content=ft.Row([
                    ft.Column([
                        ft.Text(f"Total: {len(productos)} productos", size=14, weight=ft.FontWeight.W_600, color=SECONDARY_COLOR),
                        ft.Text("Lista completa del inventario", size=12, color=f"{SECONDARY_COLOR}70"),
                    ]),
                    ft.Container(expand=True),
                    ft.OutlinedButton(
                        content=ft.Row([
                            ft.Icon(ft.Icons.REFRESH, size=16),
                            ft.Text("Actualizar", size=13, weight=ft.FontWeight.W_500),
                        ], spacing=6),
                        on_click=lambda e: actualizar_lista(),
                        style=ft.ButtonStyle(
                            shape=ft.RoundedRectangleBorder(radius=10),
                            padding=ft.padding.symmetric(horizontal=16, vertical=10),
                        )
                    ),
                ]),
                bgcolor=CARD_BG,
                padding=16,
                border_radius=12,
                margin=ft.margin.only(bottom=15),
            ),
            lista_productos,
        ], scroll=ft.ScrollMode.AUTO, expand=True)
        actualizar_lista()
        page.update()

    def pagina_ia(route):
        content_container.content = ft.Column([
            crear_header("Análisis con IA", "Insights inteligentes para optimizar tu inventario"),
            
            ft.Container(
                content=ft.Column([
                    ft.Row([
                        ft.Icon(ft.Icons.ANALYTICS, color=PRIMARY_COLOR, size=22),
                        ft.Text("Análisis Inteligente", size=18, weight=ft.FontWeight.BOLD, color=NAVBAR_BG),
                    ], spacing=10),
                    ft.Divider(height=1, color=f"{SECONDARY_COLOR}20"),
                    ft.Text("Nuestra IA analizará tu inventario y te proporcionará recomendaciones personalizadas.", 
                           size=13, color=SECONDARY_COLOR),
                    crear_boton_principal("Iniciar Análisis", ft.Icons.PLAY_ARROW, analizar, SUCCESS_COLOR),
                ], spacing=15),
                bgcolor=CARD_BG, 
                border_radius=16, 
                padding=20,
                margin=ft.margin.only(bottom=20),
                shadow=ft.BoxShadow(
                    spread_radius=1, 
                    blur_radius=12, 
                    color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK), 
                    offset=ft.Offset(0, 2)
                ),
                on_hover=lambda e: on_card_hover(e),
            ),
            resultado_ia,
        ], scroll=ft.ScrollMode.AUTO, expand=True)
        page.update()

    def pagina_chat(route):
        content_container.content = ft.Column([
            crear_header("Asistente IA", "Conversa con inteligencia artificial especializada"),
            
            ft.Container(
                content=ft.Column([
                    ft.Row([
                        ft.Icon(ft.Icons.SMART_TOY, color=ACCENT_COLOR, size=22),
                        ft.Text("Chat Inteligente", size=18, weight=ft.FontWeight.BOLD, color=NAVBAR_BG),
                    ], spacing=10),
                    ft.Divider(height=1, color=f"{SECONDARY_COLOR}20"),
                    ft.Text("Pregunta anything sobre gestión de inventarios, análisis de productos o estrategias de ventas.", 
                           size=13, color=SECONDARY_COLOR),
                ], spacing=12),
                bgcolor=CARD_BG, 
                border_radius=16, 
                padding=20,
                margin=ft.margin.only(bottom=20),
                shadow=ft.BoxShadow(
                    spread_radius=1, 
                    blur_radius=12, 
                    color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK), 
                    offset=ft.Offset(0, 2)
                ),
                on_hover=lambda e: on_card_hover(e),
            ),
            
            ft.Container(
                content=ft.Column([
                    mensajes_chat,
                    ft.Container(height=15),
                    ft.Row([
                        input_mensaje,
                        ft.IconButton(
                            icon=ft.Icons.SEND,
                            icon_color=ft.Colors.WHITE,
                            icon_size=20,
                            on_click=enviar_mensaje_chat,
                            tooltip="Enviar mensaje",
                            style=ft.ButtonStyle(
                                shape=ft.RoundedRectangleBorder(radius=10),
                                bgcolor=ACCENT_COLOR,
                                padding=10,
                            ),
                        ),
                    ], spacing=10),
                ], spacing=0),
                bgcolor=CARD_BG,
                border_radius=16,
                padding=20,
                expand=True,
                shadow=ft.BoxShadow(
                    spread_radius=1, 
                    blur_radius=12, 
                    color=ft.Colors.with_opacity(0.08, ft.Colors.BLACK), 
                    offset=ft.Offset(0, 2)
                ),
            ),
        ], scroll=ft.ScrollMode.AUTO, expand=True)
        
        if len(mensajes_chat.controls) == 0:
            agregar_mensaje_chat("¡Hola! Soy tu asistente de IA especializado en gestión de inventarios. ¿En qué puedo ayudarte hoy?", es_usuario=False)
        
        page.update()

    def on_route_change(e: ft.RouteChangeEvent):
        # Actualizar items de navegación según la ruta activa
        for i, item in enumerate(nav_items):
            top_navigation.content.controls[2].controls[i] = create_nav_item(
                item["icon"], item["label"], item["route"], page.route == item["route"]
            )
        
        if page.route == "/":
            pagina_principal(e.route)
        elif page.route == "/inventario":
            pagina_inventario(e.route)
        elif page.route == "/productos":
            pagina_productos(e.route)
        elif page.route == "/ia":
            pagina_ia(e.route)
        elif page.route == "/chat":
            pagina_chat(e.route)
        else:
            pagina_principal(e.route)  # ruta por defecto
        
        page.update()

    # Registrar eventos de navegación
    page.on_route_change = on_route_change

    # Estructura principal de la aplicación
    page.add(
        ft.Column([
            top_navigation,
            content_container,
        ], expand=True)
    )

    # Iniciar en la ruta actual
    page.go(page.route or "/")

ft.app(target=main)
