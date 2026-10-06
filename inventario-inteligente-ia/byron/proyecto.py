import flet as ft
from typing import Dict, Any, List, Tuple
import json
import logging
import hashlib
import uuid
from collections import defaultdict

# Configuración básica de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# -----------------------------
# Constantes
# -----------------------------
CART_STORAGE_KEY = "vehicle_store_cart"
USER_STORAGE_KEY = "vehicle_store_user"
USERS_DATA_STORAGE_KEY = "vehicle_store_all_users"
PRODUCTS_STORAGE_KEY = "vehicle_store_products_data" # Nuevo: para la persistencia de productos
ORDERS_STORAGE_KEY = "vehicle_store_orders_data"
LOGO_URL = "https://flet.dev/img/flet-logo.png"
SIDEBAR_BG_COLOR = ft.Colors.CYAN_ACCENT_100
MAIN_CONTENT_BG_COLOR = ft.Colors.WHITE
INNER_CONTENT_BG_COLOR = ft.Colors.WHITE
PRIMARY_ACCENT_COLOR = ft.Colors.CYAN_ACCENT_700

# -----------------------------
# Estado global de la app
# -----------------------------
app_state = {
    "cart_items": {},
    "cart_icon_button": None,
    "current_user": None,
    "all_users": {},
    "products_data": {}, # Ahora los productos se cargan aquí
    "orders": []
}

# -----------------------------
# Funciones de Utilidad
# -----------------------------
def format_price(price: float) -> str:
    """Formatea el precio a un estilo local (ej: $1.234,56)."""
    try:
        return f"${price:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception as e:
        logging.error(f"Error al formatear precio {price}: {e}")
        return "$0.00"

def get_product_by_id(product_id: str) -> Dict[str, Any] | None:
    """Busca un producto por su ID en todos los datos de productos."""
    for category_products in app_state["products_data"].values():
        for product in category_products:
            if product["id"] == product_id:
                return product
    return None

def generate_product_slug(product_name: str) -> str:
    """Genera una URL amigable (slug) a partir del nombre del producto."""
    return product_name.lower().replace(' ', '-').replace('_', '-').strip('-')

def get_product_details_route(category: str, product: Dict[str, Any]) -> str:
    """Construye la ruta para la vista de detalles de un producto."""
    slug = generate_product_slug(product.get('name', ''))
    return f"/{category}/{slug}"

def navigate_to_category(category: str, page: ft.Page):
    """Navega a la vista de la categoría de productos especificada."""
    page.go(f"/{category}")

# -----------------------------
# Funciones de Persistencia
# -----------------------------
def save_products_data(page: ft.Page):
    """Guarda los datos de productos en el almacenamiento local."""
    try:
        page.client_storage.set(PRODUCTS_STORAGE_KEY, json.dumps(app_state["products_data"]))
        logging.info("Datos de productos guardados con éxito.")
    except Exception as e:
        logging.error(f"Error al guardar los datos de productos: {e}")

def save_orders(page: ft.Page):
    """Guarda el historial de órdenes en el almacenamiento local."""
    try:
        page.client_storage.set(ORDERS_STORAGE_KEY, json.dumps(app_state["orders"]))
        logging.info("Historial de órdenes guardado con éxito.")
    except Exception as e:
        logging.error(f"Error al guardar el historial de órdenes: {e}")

# -----------------------------
# Funciones de Autenticación
# -----------------------------
def hash_password(password: str) -> str:
    """Hashea una contraseña para almacenarla de forma segura."""
    return hashlib.sha256(password.encode()).hexdigest()

def load_user_data(page: ft.Page):
    """Carga los datos del usuario logueado desde el almacenamiento local."""
    try:
        # Cargar todos los usuarios
        all_users_json = page.client_storage.get(USERS_DATA_STORAGE_KEY)
        if all_users_json:
            app_state["all_users"] = json.loads(all_users_json)
        
        # Cargar el usuario actual
        stored_user = page.client_storage.get(USER_STORAGE_KEY)
        if stored_user:
            app_state["current_user"] = json.loads(stored_user)
            # Sincronizar con el estado global de todos los usuarios
            if app_state["current_user"] and app_state["current_user"]["username"] in app_state["all_users"]:
                app_state["current_user"] = app_state["all_users"][app_state["current_user"]["username"]]
            
            logging.info(f"Usuario cargado: {app_state['current_user']['username']}")
        else:
            app_state["current_user"] = None
    except json.JSONDecodeError:
        logging.error("Error al decodificar JSON de usuarios.")
        app_state["current_user"] = None
        app_state["all_users"] = {}
    except Exception as e:
        logging.error(f"Error inesperado al cargar datos de usuario: {e}")
        app_state["current_user"] = None
        app_state["all_users"] = {}

def save_user_data(page: ft.Page, user: Dict[str, Any]):
    """Guarda los datos del usuario logueado en el almacenamiento local."""
    try:
        # Actualiza el usuario en el estado global
        app_state["all_users"][user["username"]] = user
        page.client_storage.set(USERS_DATA_STORAGE_KEY, json.dumps(app_state["all_users"]))
        
        # Guarda la información del usuario logueado
        page.client_storage.set(USER_STORAGE_KEY, json.dumps(user))
    except Exception as e:
        logging.error(f"Error al guardar los datos del usuario: {e}")

def logout(page: ft.Page):
    """Cierra la sesión del usuario."""
    page.client_storage.remove(USER_STORAGE_KEY)
    app_state["current_user"] = None
    show_snackbar(page, "Sesión cerrada con éxito.", info=True)
    page.go("/")


# -----------------------------
# Funciones de Manejo del Carrito
# -----------------------------
def load_cart_from_storage(page: ft.Page):
    """Carga el contenido del carrito desde el almacenamiento local."""
    try:
        stored_cart = page.client_storage.get(CART_STORAGE_KEY)
        if not stored_cart:
            app_state["cart_items"] = {}
            logging.info("Almacenamiento del carrito vacío o no encontrado.")
            return

        loaded_data = json.loads(stored_cart)
        reconstructed_cart = {}
        for item_id, data in loaded_data.items():
            product = get_product_by_id(item_id)
            if product:
                reconstructed_cart[item_id] = {
                    "item": product,
                    "quantity": data.get("quantity", 0),
                    "hours": data.get("hours", 0),  # Cargar horas
                    "half_hour": data.get("half_hour", False) # Cargar media hora
                }
            else:
                logging.warning(f"Producto con ID '{item_id}' encontrado en almacenamiento pero no en datos. Será ignorado.")

        app_state["cart_items"] = reconstructed_cart
        logging.info(f"Carrito cargado desde almacenamiento. {len(app_state['cart_items'])} ítems.")

    except json.JSONDecodeError:
        logging.error("Error al decodificar JSON del carrito. Se reiniciará el carrito.")
        app_state["cart_items"] = {}
    except Exception as e:
        logging.error(f"Ocurrió un error inesperado al cargar el carrito: {e}")
        app_state["cart_items"] = {}

def save_cart_to_storage(page: ft.Page):
    """Guarda el contenido actual del carrito en el almacenamiento local."""
    try:
        data_to_save = {
            pid: {
                "quantity": data["quantity"],
                "hours": data.get("hours", 0),
                "half_hour": data.get("half_hour", False)
            }
            for pid, data in app_state["cart_items"].items()
            if "quantity" in data and data["quantity"] > 0 and "item" in data
        }
        page.client_storage.set(CART_STORAGE_KEY, json.dumps(data_to_save))
        logging.debug(f"Carrito guardado en almacenamiento: {len(data_to_save)} ítems.")
    except Exception as e:
        logging.error(f"Ocurrió un error al guardar el carrito: {e}")

def add_to_cart_with_hours(product: Dict[str, Any], hours: int, half_hour: bool, page: ft.Page):
    """Agrega un producto al carrito con la cantidad de horas especificada."""
    pid = product.get("id")
    if not pid:
        show_snackbar(page, "Error: Producto sin ID.", error=True)
        return

    # Si el producto ya está en el carrito, se reemplaza la entrada
    app_state["cart_items"][pid] = {
        "item": product,
        "quantity": 1,
        "hours": hours,
        "half_hour": half_hour
    }

    save_cart_to_storage(page)
    show_snackbar(page, f"'{product.get('name', 'Producto')}' añadido al carrito por {hours}h.", info=True)
    update_cart_icon()
    update_cart_view(page)

def add_to_cart(product: Dict[str, Any], page: ft.Page):
    """Agrega un producto al carrito o incrementa su cantidad."""
    pid = product.get("id")
    if not pid:
        show_snackbar(page, "Error: Producto sin ID.", error=True)
        return

    # Si se añade desde la tarjeta, por defecto se añade 1 unidad por 1 hora
    # Esta función se mantiene para las tarjetas de productos
    current_quantity = app_state["cart_items"].get(pid, {}).get("quantity", 0)
    app_state["cart_items"][pid] = {"item": product, "quantity": current_quantity + 1, "hours": 1, "half_hour": False}

    save_cart_to_storage(page)
    show_snackbar(page, f"'{product.get('name', 'Producto')}' añadido al carrito 🛒", info=True)
    update_cart_icon()
    update_cart_view(page)


def remove_from_cart(pid: str, page: ft.Page, decrement: bool = True):
    """Elimina una unidad de un producto del carrito, o el producto completo."""
    if pid not in app_state["cart_items"]:
        show_snackbar(page, "El producto no se encontró en el carrito.", error=True)
        return

    if decrement:
        app_state["cart_items"][pid]["quantity"] -= 1
        if app_state["cart_items"][pid]["quantity"] <= 0:
            product_name = app_state["cart_items"][pid]['item']['name']
            del app_state["cart_items"][pid]
            show_snackbar(page, f"'{product_name}' eliminado del carrito.")
        else:
            show_snackbar(page, f"Cantidad de '{app_state['cart_items'][pid]['item']['name']}' actualizada.")
    else:
        product_name = app_state["cart_items"][pid]['item']['name']
        del app_state["cart_items"][pid]
        show_snackbar(page, f"'{product_name}' eliminado completamente del carrito.")

    save_cart_to_storage(page)
    update_cart_icon()
    update_cart_view(page)

def clear_cart(page: ft.Page):
    """Vacía completamente el carrito."""
    if not app_state["cart_items"]:
        show_snackbar(page, "El carrito ya está vacío.", info=True)
        return

    app_state["cart_items"].clear()
    save_cart_to_storage(page)
    update_cart_icon()
    update_cart_view(page)
    show_snackbar(page, "Carrito vaciado 🧹", info=True)

# -----------------------------
# Funciones de Interfaz de Usuario (UI Helpers)
# -----------------------------
def show_snackbar(page: ft.Page, message: str, error: bool = False, info: bool = False):
    """Muestra un mensaje emergente (snackbar) en la página."""
    bgcolor = PRIMARY_ACCENT_COLOR if info else (ft.Colors.RED_ACCENT_700 if error else ft.Colors.BLUE_GREY_800)
    icon = ft.Icons.INFO if info else (ft.Icons.ERROR if error else ft.Icons.CHECK_CIRCLE)
    page.snack_bar = ft.SnackBar(
        ft.Row([ft.Icon(icon, color=ft.Colors.WHITE), ft.Text(message, color=ft.Colors.WHITE)], alignment=ft.MainAxisAlignment.START, vertical_alignment=ft.CrossAxisAlignment.CENTER),
        open=True,
        duration=3000,
        bgcolor=bgcolor,
        elevation=6
    )
    page.update()

def update_cart_icon():
    """Actualiza el contador y el ícono del botón del carrito en el menú lateral."""
    if app_state["cart_icon_button"] and app_state["cart_icon_button"].page:
        total_items = sum(item.get("quantity", 0) for item in app_state["cart_items"].values())
        app_state["cart_icon_button"].text = f"Carrito ({total_items})" if total_items > 0 else "Carrito"
        app_state["cart_icon_button"].icon = ft.Icons.SHOPPING_CART if total_items > 0 else ft.Icons.SHOPPING_CART_OUTLINED
        app_state["cart_icon_button"].update()

def update_cart_view(page: ft.Page):
    """Navega a la vista del carrito si está abierta para que se actualice su contenido."""
    if page.route == "/cart":
        logging.debug("Actualizando vista del carrito...")
        page.go("/cart")


# -----------------------------
# Componentes de UI
# -----------------------------
def sidebar_menu(page: ft.Page) -> ft.Column:
    """Crea el menú lateral de navegación."""
    total_items = sum(item.get("quantity", 0) for item in app_state["cart_items"].values())
    icon = ft.Icons.SHOPPING_CART if total_items > 0 else ft.Icons.SHOPPING_CART_OUTLINED
    text = f"Carrito ({total_items})" if total_items > 0 else "Carrito"

    app_state["cart_icon_button"] = ft.ElevatedButton(
        text,
        on_click=lambda _: page.go("/cart"),
        width=220,
        bgcolor=ft.Colors.WHITE,
        color=ft.Colors.BLUE_GREY_800,
        icon=icon,
        style=ft.ButtonStyle(
            padding=ft.padding.symmetric(vertical=12, horizontal=15),
            shape=ft.RoundedRectangleBorder(radius=10)
        )
    )

    menu_buttons = [
        ft.ElevatedButton(
            "Inicio",
            on_click=lambda _: page.go("/"),
            width=220,
            bgcolor=ft.Colors.WHITE,
            color=ft.Colors.BLUE_GREY_800,
            icon=ft.Icons.HOME,
            style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
        ),
        ft.ElevatedButton(
            "Motos",
            on_click=lambda _: navigate_to_category("motos", page),
            width=220,
            bgcolor=ft.Colors.WHITE,
            color=ft.Colors.BLUE_GREY_800,
            icon=ft.Icons.DIRECTIONS_BIKE,
            style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
        ),
        ft.ElevatedButton(
            "Carros",
            on_click=lambda _: navigate_to_category("cars", page),
            width=220,
            bgcolor=ft.Colors.WHITE,
            color=ft.Colors.BLUE_GREY_800,
            icon=ft.Icons.DIRECTIONS_CAR,
            style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
        ),
    ]

    # Añadir el botón del dashboard de admin si el usuario es 'admin'
    if app_state["current_user"] and app_state["current_user"]["username"] == "admin":
        menu_buttons.insert(1, ft.ElevatedButton(
            "Dashboard de Admin",
            on_click=lambda _: page.go("/admin_dashboard"),
            width=220,
            bgcolor=ft.Colors.CYAN_ACCENT_100,
            color=ft.Colors.BLUE_GREY_800,
            icon=ft.Icons.DASHBOARD_ROUNDED,
            style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
        ))

    auth_buttons = []
    if app_state["current_user"]:
        auth_buttons.extend([
            ft.ElevatedButton(
                f"Hola, {app_state['current_user']['username']}",
                on_click=lambda _: page.go("/profile"),
                width=220,
                bgcolor=PRIMARY_ACCENT_COLOR,
                color=ft.Colors.WHITE,
                icon=ft.Icons.PERSON,
                style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
            ),
            ft.ElevatedButton(
                "Cerrar Sesión",
                on_click=lambda _: logout(page),
                width=220,
                bgcolor=ft.Colors.RED_ACCENT_700,
                color=ft.Colors.WHITE,
                icon=ft.Icons.LOGOUT,
                style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
            )
        ])
    else:
        auth_buttons.extend([
            ft.ElevatedButton(
                "Iniciar Sesión",
                on_click=lambda _: page.go("/login"),
                width=220,
                bgcolor=PRIMARY_ACCENT_COLOR,
                color=ft.Colors.WHITE,
                icon=ft.Icons.LOGIN,
                style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
            ),
            ft.ElevatedButton(
                "Registrarse",
                on_click=lambda _: page.go("/signup"),
                width=220,
                bgcolor=ft.Colors.BLUE_GREY_200,
                color=ft.Colors.BLUE_GREY_800,
                icon=ft.Icons.PERSON_ADD,
                style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=12, horizontal=15), shape=ft.RoundedRectangleBorder(radius=10))
            )
        ])

    return ft.Column(
        [
            ft.Container(
                content=ft.Image(src=LOGO_URL, width=75, height=75, fit=ft.ImageFit.CONTAIN, border_radius=ft.border_radius.all(20)),
                padding=ft.padding.only(bottom=30)
            ),
            *menu_buttons,
            ft.Container(height=30),
            app_state["cart_icon_button"],
            ft.Container(height=30),
            *auth_buttons
        ],
        alignment=ft.MainAxisAlignment.START,
        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        spacing=15,
        width=250,
    )

def product_card(product: Dict[str, Any], category: str, page: ft.Page) -> ft.Card:
    """Crea una tarjeta para mostrar un producto en el catálogo."""
    product_id = product.get("id")
    if not product_id:
        logging.error("Producto sin ID, no se puede crear tarjeta.")
        return ft.Container()

    image_url = product.get("url", "")
    if not image_url:
        image_url = "https://media.istockphoto.com/id/1415203156/es/vector/p%C3%A1gina-de-error-icono-vectorial-de-p%C3%A1gina-no-encontrada-en-el-dise%C3%B1o-de-estilo-de-l%C3%ADnea.jpg?s=612x612&w=0&k=20&c=nss_aWPtTb0hpc4oiGfFs_PGfihrNwVX06wxkWVkBfQ="
        image_widget = ft.Column([
            ft.Image(
                src=image_url,
                width=270,
                height=180,
                fit=ft.ImageFit.CONTAIN,
                border_radius=ft.border_radius.all(5)
            ),
            ft.Text("Imagen no disponible", color=ft.Colors.RED_ACCENT_700, size=14, text_align=ft.TextAlign.CENTER)
        ])
    else:
        image_widget = ft.Image(
            src=image_url,
            width=270,
            height=180,
            fit=ft.ImageFit.COVER,
            border_radius=ft.border_radius.all(5)
        )

    return ft.Card(
        content=ft.Container(
            padding=ft.padding.all(15),
            bgcolor=ft.Colors.WHITE,
            border_radius=ft.border_radius.all(10),
            content=ft.Column(
                [
                    image_widget,
                    ft.Text(
                        product.get("name", "Sin Nombre"),
                        size=18,
                        weight=ft.FontWeight.BOLD,
                        text_align=ft.TextAlign.CENTER,
                        max_lines=1,
                        overflow=ft.TextOverflow.ELLIPSIS,
                        color=ft.Colors.BLUE_GREY_800
                    ),
                    ft.Text(
                        f"Precio por hora: {format_price(product.get('price', 0.0))}",
                        size=16,
                        color=PRIMARY_ACCENT_COLOR,
                        weight=ft.FontWeight.W_500
                    ),
                    ft.ElevatedButton(
                        "Ver Detalles",
                        on_click=lambda _, p=product, c=category: page.go(get_product_details_route(c, p)),
                        width=200,
                        style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=8),
                                             bgcolor=ft.Colors.BLUE_GREY_200,
                                             color=ft.Colors.BLUE_GREY_800)
                    ),
                    ft.ElevatedButton(
                        "Comprar (1h)",
                        icon=ft.Icons.ADD_SHOPPING_CART,
                        on_click=lambda _, p=product: add_to_cart(p, page),
                        width=200,
                        bgcolor=PRIMARY_ACCENT_COLOR,
                        color=ft.Colors.WHITE,
                        style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=8))
                    )
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                spacing=10
            )
        )
    )

def cart_item_widget(item_data: Dict[str, Any], page: ft.Page) -> ft.Row:
    """Crea un widget para mostrar un ítem en la vista del carrito."""
    product = item_data.get("item")
    qty = item_data.get("quantity", 0)
    hours = item_data.get("hours", 0)
    half_hour = item_data.get("half_hour", False)

    if not product or not product.get("id"):
        logging.error("Ítem de carrito inválido o sin producto/ID.")
        return ft.Row()

    pid = product["id"]
    unit_price = product.get("price", 0.0) # Uso seguro del precio
    # Cálculo del subtotal corregido
    subtotal = unit_price * (hours + (0.5 if half_hour else 0)) * qty


    return ft.Row(
        [
            ft.Image(src=product.get("url", ""), width=70, height=70, fit=ft.ImageFit.COVER, border_radius=ft.border_radius.all(5)),
            ft.Column(
                [
                    ft.Text(product.get("name", "Sin Nombre"), weight=ft.FontWeight.BOLD),
                    ft.Text(f"Precio por hora: {format_price(product.get('price', 0.0))}", size=14, color=ft.Colors.BLUE_GREY_600),
                    ft.Text(f"Horas: {hours}{'+0.5h' if half_hour else ''}", size=14, color=ft.Colors.BLUE_GREY_600)
                ],
                spacing=2,
                expand=True
            ),
            ft.Row(
                [
                    ft.IconButton(
                        ft.Icons.REMOVE_CIRCLE_OUTLINE,
                        icon_color=ft.Colors.RED_ACCENT_700,
                        tooltip="Disminuir cantidad",
                        on_click=lambda _, p_id=pid: remove_from_cart(p_id, page=page, decrement=True)
                    ),
                    ft.Text(str(qty), size=18, weight=ft.FontWeight.BOLD, width=30, text_align=ft.TextAlign.CENTER, color=ft.Colors.BLUE_GREY_800),
                    ft.IconButton(
                        ft.Icons.ADD_CIRCLE_OUTLINE,
                        icon_color=PRIMARY_ACCENT_COLOR,
                        tooltip="Aumentar cantidad",
                        on_click=lambda _, p=product: add_to_cart_with_hours(p, hours, half_hour, page=page)
                    )
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                vertical_alignment=ft.CrossAxisAlignment.CENTER
            ),
            ft.Text(f"Subtotal: {format_price(subtotal)}", weight=ft.FontWeight.BOLD, color=PRIMARY_ACCENT_COLOR, width=150, text_align=ft.TextAlign.RIGHT),
            ft.IconButton(
                ft.Icons.DELETE_OUTLINE,
                tooltip="Eliminar producto del carrito",
                icon_color=ft.Colors.RED_ACCENT_700,
                on_click=lambda _, p_id=pid: remove_from_cart(p_id, page=page, decrement=False)
            )
        ],
        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
        vertical_alignment=ft.CrossAxisAlignment.CENTER,
        key=pid
    )

# -----------------------------
# Vistas de la Aplicación
# -----------------------------
def render_sidebar_container(page: ft.Page) -> ft.Container:
    """Crea un contenedor reutilizable para el sidebar con el color de fondo especificado."""
    return ft.Container(
        content=sidebar_menu(page),
        bgcolor=SIDEBAR_BG_COLOR,
        alignment=ft.alignment.top_center,
        width=250
    )

def view_main(page: ft.Page) -> ft.View:
    """Vista principal de bienvenida."""
    sidebar_container = render_sidebar_container(page)

    return ft.View(
        "/",
        [
            ft.Row(
                [
                    sidebar_container,
                    ft.Container(
                        expand=True,
                        alignment=ft.alignment.center,
                        padding=ft.padding.all(30),
                        bgcolor=MAIN_CONTENT_BG_COLOR,
                        content=ft.Column(
                            [
                                ft.Text("Bienvenido a nuestra Tienda de Vehículos 🌟", size=36, weight=ft.FontWeight.BOLD, text_align=ft.TextAlign.CENTER, color=ft.Colors.BLUE_GREY_800),
                                ft.Container(height=30),
                                # Agregando la imagen al home
                                ft.Image(
                                    src="https://hips.hearstapps.com/hmg-prod/images/alpine-mv-agusta-5-800x450-1610444260.jpg",
                                    width=800,
                                    height=400,
                                    fit=ft.ImageFit.COVER,
                                    border_radius=ft.border_radius.all(10)
                                ),
                                ft.Container(height=30),
                                ft.Text(
                                    "Explora nuestra exclusiva selección de motos y autos. ¡Tu próximo vehículo te espera!",
                                    size=20,
                                    text_align=ft.TextAlign.CENTER,
                                    color=ft.Colors.BLUE_GREY_600
                                )
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                            spacing=20,
                            expand=True
                        )
                    )
                ],
                expand=True
            )
        ],
        bgcolor=INNER_CONTENT_BG_COLOR
    )

def view_products(category: str, page: ft.Page) -> ft.View:
    """Vista para mostrar el catálogo de productos de una categoría."""
    product_list = app_state["products_data"].get(category, [])
    title_map = {
        "motos": "Catálogo de Motos 🏍️",
        "cars": "Catálogo de Autos 🚗"
    }
    title = title_map.get(category, "Catálogo de Productos")
    sidebar_container = render_sidebar_container(page)

    product_cards = [product_card(p, category, page) for p in product_list if p.get("id")]

    return ft.View(
        f"/{category}",
        [
            ft.Row(
                [
                    sidebar_container,
                    ft.Container(
                        expand=True,
                        padding=ft.padding.symmetric(vertical=20, horizontal=30),
                        content=ft.Column(
                            [
                                ft.Row([
                                    ft.IconButton(ft.Icons.ARROW_BACK, tooltip="Volver al Inicio", on_click=lambda _: page.go("/")),
                                    ft.Text(title, weight=ft.FontWeight.BOLD, size=24, color=ft.Colors.BLUE_GREY_800)
                                ], alignment=ft.MainAxisAlignment.CENTER, width=float('inf')),
                                ft.ResponsiveRow(
                                    [ft.Container(content=card, col={"sm": 6, "md": 4, "xl": 3}) for card in product_cards],
                                    spacing=20,
                                    run_spacing=20,
                                    alignment=ft.MainAxisAlignment.START,
                                ),
                            ],
                            expand=True,
                            alignment=ft.MainAxisAlignment.START,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                            scroll=ft.ScrollMode.AUTO,
                        )
                    )
                ],
                expand=True
            )
        ],
        bgcolor=INNER_CONTENT_BG_COLOR
    )

def view_product_details(category: str, product_slug: str, page: ft.Page) -> ft.View | None:
    """Vista para mostrar los detalles de un producto específico, incluyendo otros productos de la misma categoría."""
    product = None
    for p in app_state["products_data"].get(category, []):
        if generate_product_slug(p.get('name', '')) == product_slug:
            product = p
            break

    if not product:
        show_snackbar(page, "Producto no encontrado.", error=True)
        page.go(f"/{category}")
        return None

    sidebar_container = render_sidebar_container(page)

    # Mejorar especificaciones técnicas con íconos
    specs_icon_map = {
        "Motor": ft.Icons.SETTINGS,        # <-- Cambia 'settings' por 'SETTINGS'
        "Potencia": ft.Icons.FLASH_ON,     # <-- Cambia 'flash_on' por 'FLASH_ON'
        "Peso": ft.Icons.SCALE,            # <-- Cambia 'scale' por 'SCALE'
        "Transmisión": ft.Icons.SYNC_ALT,  # <-- Cambia 'sync_alt' por 'SYNC_ALT'
    }
    specs_list = []
    specs = product.get("specs", {})
    for key, value in specs.items():
        specs_list.append(
            ft.ListTile(
                leading=ft.Icon(specs_icon_map.get(key, ft.Icons.info_outline), color=PRIMARY_ACCENT_COLOR),
                title=ft.Text(f"{key.capitalize()}:", weight=ft.FontWeight.BOLD),
                subtitle=ft.Text(value, color=ft.Colors.BLUE_GREY_700)
            )
        )

    # Galería de imágenes con miniaturas clickeables
    image_gallery_urls = product.get("images", [])
    if not image_gallery_urls:
        image_gallery_urls = [product.get("url", "")]

    main_image_src = image_gallery_urls[0]
    main_image = ft.Image(src=main_image_src, width=500, height=400, fit=ft.ImageFit.COVER, border_radius=ft.border_radius.all(10))

    def change_main_image(e):
        main_image.src = e.control.data
        main_image.update()
        page.update()

    thumbnails = ft.Container()
    if len(image_gallery_urls) > 1:
        thumbnails = ft.Row(
            [
                ft.Container(
                    content=ft.Image(src=url, width=100, height=75, fit=ft.ImageFit.COVER, border_radius=ft.border_radius.all(5)),
                    border=ft.border.all(2, PRIMARY_ACCENT_COLOR if main_image.src == url else ft.Colors.TRANSPARENT),
                    border_radius=ft.border_radius.all(8),
                    on_click=change_main_image,
                    data=url,
                    tooltip="Clic para ver esta imagen"
                ) for url in image_gallery_urls
            ],
            spacing=10,
            alignment=ft.MainAxisAlignment.START
        )

    # Otros productos de la misma categoría
    other_products = [p for p in app_state["products_data"].get(category, []) if p['id'] != product['id']]
    other_product_cards = [
        ft.Container(content=product_card(p, category, page), col={"sm": 6, "md": 4, "xl": 3})
        for p in other_products
    ]

    related_products_section = ft.Column(
        [
            ft.Divider(height=40),
            ft.Text(
                "Otros Vehículos de la Categoría", 
                size=24, 
                weight=ft.FontWeight.BOLD, 
                color=ft.Colors.BLUE_GREY_800
            ),
            ft.ResponsiveRow(
                other_product_cards,
                spacing=20,
                run_spacing=20,
                alignment=ft.MainAxisAlignment.START,
            )
        ],
        alignment=ft.MainAxisAlignment.START,
        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
        spacing=20
    )

    # Campo para la cantidad de horas
    hours_field = ft.TextField(
        label="Cantidad de horas",
        value="1",
        keyboard_type=ft.KeyboardType.NUMBER,
        width=150,
        input_filter=ft.InputFilter(allow=True, regex_string=r"^\d*$", replacement_string=""),
        on_change=lambda e: update_total_price()
    )
    
    half_hour_checkbox = ft.Checkbox(
        label="Agregar 30 minutos",
        value=False,
        on_change=lambda e: update_total_price()
    )

    total_price_text = ft.Text(
        f"Total: {format_price(product.get('price', 0.0))}",
        size=28,
        weight=ft.FontWeight.BOLD,
        color=PRIMARY_ACCENT_COLOR,
        visible=True
    )

    def update_total_price():
        try:
            hours = int(hours_field.value) if hours_field.value else 0
            price = product.get('price', 0.0)
            half_hour_cost = price * 0.5 if half_hour_checkbox.value else 0
            total = price * hours + half_hour_cost
            total_price_text.value = f"Total: {format_price(total)}"
            page.update()
        except ValueError:
            total_price_text.value = "Total: $0.00"
            page.update()

    def add_to_cart_and_navigate(e):
        try:
            hours = int(hours_field.value) if hours_field.value else 0
            if hours <= 0 and not half_hour_checkbox.value:
                show_snackbar(page, "La cantidad de horas debe ser mayor que cero.", error=True)
                return
            add_to_cart_with_hours(product, hours, half_hour_checkbox.value, page)
        except ValueError:
            show_snackbar(page, "Por favor, ingresa un número válido de horas.", error=True)

    # Botón para compartir (simulado)
    def share_product(e):
        show_snackbar(page, "¡Enlace del producto copiado!", info=True)

    return ft.View(
        f"/{category}/{product_slug}",
        [
            ft.Row(
                [
                    sidebar_container,
                    ft.Container(
                        expand=True,
                        padding=30,
                        alignment=ft.alignment.top_center,
                        content=ft.Column(
                            [
                                ft.Row([
                                    ft.IconButton(ft.Icons.ARROW_BACK_IOS, tooltip="Volver al Catálogo", on_click=lambda _: page.go(f"/{category}")),
                                    ft.Text(f"{product.get('name', 'Producto')}", weight=ft.FontWeight.BOLD, size=32, color=ft.Colors.BLUE_GREY_800),
                                    ft.IconButton(ft.Icons.SHARE, tooltip="Compartir producto", on_click=share_product)
                                ], alignment=ft.MainAxisAlignment.CENTER, width=float('inf')),

                                ft.Divider(),

                                ft.Container(
                                    content=ft.ResponsiveRow([
                                        ft.Container(
                                            content=ft.Column(
                                                [
                                                    ft.Text("Galería de Imágenes", size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                                    main_image,
                                                    ft.Container(height=10),
                                                    thumbnails
                                                ],
                                                alignment=ft.MainAxisAlignment.CENTER,
                                                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                                                spacing=15
                                            ),
                                            col={"xs": 12, "md": 6},
                                            alignment=ft.alignment.center
                                        ),
                                        ft.Container(
                                            content=ft.Column(
                                                [
                                                    ft.Text(f"Precio por hora: {format_price(product.get('price', 0.0))}", size=28, weight=ft.FontWeight.BOLD, color=PRIMARY_ACCENT_COLOR),
                                                    ft.Divider(),
                                                    ft.Text("Descripción:", size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                                    ft.Text(product.get("description", "Sin descripción disponible."), size=16, color=ft.Colors.BLUE_GREY_700, selectable=True),
                                                    ft.Container(height=20),
                                                    ft.Text("Especificaciones Técnicas:", size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                                    ft.Container(
                                                        content=ft.Column(specs_list),
                                                        padding=ft.padding.only(left=10),
                                                        border_radius=ft.border_radius.all(5)
                                                    ),
                                                    ft.Container(height=30),
                                                    ft.Text("Alquilar por horas:", size=20, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                                    ft.Row(
                                                        [
                                                            hours_field,
                                                            half_hour_checkbox
                                                        ], alignment=ft.MainAxisAlignment.CENTER
                                                    ),
                                                    ft.Row(
                                                        [
                                                            total_price_text
                                                        ], alignment=ft.MainAxisAlignment.CENTER
                                                    ),
                                                    ft.Container(height=30),
                                                    ft.Row(
                                                        [
                                                            ft.ElevatedButton(
                                                                "Añadir al Carrito",
                                                                icon=ft.Icons.ADD_SHOPPING_CART,
                                                                on_click=add_to_cart_and_navigate,
                                                                bgcolor=PRIMARY_ACCENT_COLOR,
                                                                color=ft.Colors.WHITE,
                                                                style=ft.ButtonStyle(
                                                                    padding=ft.padding.symmetric(vertical=15, horizontal=25),
                                                                    shape=ft.RoundedRectangleBorder(radius=10)
                                                                )
                                                            ),
                                                            ft.ElevatedButton(
                                                                "Volver al Catálogo",
                                                                icon=ft.Icons.ARROW_BACK,
                                                                on_click=lambda _: page.go(f"/{category}"),
                                                                style=ft.ButtonStyle(
                                                                    padding=ft.padding.symmetric(vertical=15, horizontal=25),
                                                                    shape=ft.RoundedRectangleBorder(radius=10)
                                                                )
                                                            )
                                                        ], alignment=ft.MainAxisAlignment.CENTER, spacing=20
                                                    )
                                                ],
                                                spacing=10,
                                                alignment=ft.MainAxisAlignment.START
                                            ),
                                            col={"xs": 12, "md": 6}
                                        )
                                    ], vertical_alignment=ft.CrossAxisAlignment.START, alignment=ft.MainAxisAlignment.CENTER, spacing=30)
                                ),
                                related_products_section,
                            ],
                            spacing=15,
                            alignment=ft.MainAxisAlignment.START,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                            expand=True,
                            scroll=ft.ScrollMode.AUTO,
                        ),
                        bgcolor=MAIN_CONTENT_BG_COLOR,
                        border_radius=ft.border_radius.all(10)
                    )
                ], expand=True
            )
        ], bgcolor=INNER_CONTENT_BG_COLOR
    )

def view_cart(page: ft.Page) -> ft.View:
    """Vista del carrito de compras."""
    sidebar_container = render_sidebar_container(page)
    
    if not app_state["cart_items"]:
        return ft.View("/cart", [
            ft.Row(
                [
                    sidebar_container,
                    ft.Container(
                        expand=True,
                        alignment=ft.alignment.center,
                        padding=ft.padding.all(30),
                        bgcolor=MAIN_CONTENT_BG_COLOR,
                        content=ft.Column(
                            [
                                ft.Icon(ft.Icons.REMOVE_SHOPPING_CART, size=120, color=ft.Colors.BLUE_GREY_300),
                                ft.Text("Tu carrito está vacío 😔", size=28, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_600),
                                ft.Text("¡Empieza a comprar para añadir tus vehículos favoritos!", size=18, color=ft.Colors.BLUE_GREY_400),
                                ft.Container(height=30),
                                ft.ElevatedButton(
                                    "Ir a la Tienda",
                                    icon=ft.Icons.SHOPPING_BAG_OUTLINED,
                                    on_click=lambda _: page.go("/"),
                                    style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=15, horizontal=30), shape=ft.RoundedRectangleBorder(radius=10))
                                )
                            ],
                            spacing=20,
                            alignment=ft.MainAxisAlignment.CENTER,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER
                        )
                    )
                ], expand=True
            )
        ], bgcolor=INNER_CONTENT_BG_COLOR)
    else:
        # Cálculo del total del carrito corregido
        total_cart_price = sum(
            (item_data["item"].get("price", 0.0) * (item_data.get("hours", 0) + (0.5 if item_data.get("half_hour", False) else 0)) * item_data.get("quantity", 0))
            for item_data in app_state["cart_items"].values()
        )
        return ft.View("/cart", [
            ft.Row(
                [
                    sidebar_container,
                    ft.Container(
                        expand=True,
                        content=ft.Column(
                            [
                                ft.Row([
                                    ft.IconButton(ft.Icons.ARROW_BACK, tooltip="Volver al Inicio", on_click=lambda _: page.go("/")),
                                    ft.Text("Carrito de Compras 🛍️", weight=ft.FontWeight.BOLD, size=24, color=ft.Colors.BLUE_GREY_800)
                                ], alignment=ft.MainAxisAlignment.CENTER, width=float('inf')),
                                ft.ListView(
                                    controls=[
                                        ft.Container(
                                            content=cart_item_widget(item_data, page),
                                            padding=ft.padding.all(15),
                                            margin=ft.margin.symmetric(vertical=5),
                                            border=ft.border.all(1, ft.Colors.BLUE_GREY_100),
                                            border_radius=ft.border_radius.all(10),
                                            bgcolor=ft.Colors.WHITE
                                        ) for item_data in app_state["cart_items"].values()
                                    ],
                                    expand=True,
                                    auto_scroll=True,
                                    padding=20,
                                ),
                                ft.Divider(height=2, color=ft.Colors.BLUE_GREY_200),
                                ft.Container(
                                    content=ft.Row(
                                        [
                                            ft.Text("Total:", size=24, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                            ft.Text(format_price(total_cart_price), size=24, weight=ft.FontWeight.BOLD, color=PRIMARY_ACCENT_COLOR)
                                        ],
                                        alignment=ft.MainAxisAlignment.END,
                                        expand=True,
                                        spacing=20,
                                    ),
                                    margin=ft.margin.symmetric(horizontal=20, vertical=10)
                                ),
                                ft.Container(
                                    content=ft.Row(
                                        [
                                            ft.ElevatedButton(
                                                "Vaciar Carrito",
                                                icon=ft.Icons.DELETE_SWEEP,
                                                on_click=lambda _: clear_cart(page),
                                                bgcolor=ft.Colors.RED_ACCENT_700,
                                                color=ft.Colors.WHITE,
                                                style=ft.ButtonStyle(
                                                    padding=ft.padding.symmetric(vertical=15, horizontal=25),
                                                    shape=ft.RoundedRectangleBorder(radius=10)
                                                )
                                            ),
                                            ft.ElevatedButton(
                                                "Pagar",
                                                icon=ft.Icons.PAYMENT,
                                                on_click=lambda _: page.go("/checkout"),
                                                bgcolor=PRIMARY_ACCENT_COLOR,
                                                color=ft.Colors.WHITE,
                                                style=ft.ButtonStyle(
                                                    padding=ft.padding.symmetric(vertical=15, horizontal=25),
                                                    shape=ft.RoundedRectangleBorder(radius=10)
                                                )
                                            )
                                        ],
                                        alignment=ft.MainAxisAlignment.END,
                                        spacing=20,
                                    ),
                                    margin=ft.margin.symmetric(horizontal=20, vertical=10)
                                )
                            ],
                            expand=True,
                            alignment=ft.MainAxisAlignment.START,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                        ),
                        bgcolor=MAIN_CONTENT_BG_COLOR
                    )
                ], expand=True
            )
        ], bgcolor=INNER_CONTENT_BG_COLOR)

def view_login(page: ft.Page) -> ft.View:
    """Vista para el inicio de sesión del usuario."""
    # Saltar el login y redirigir automáticamente
    page.go("/")
    return ft.View(
        "/login",
        [
            ft.Row(
                [
                    render_sidebar_container(page),
                    ft.Container(
                        expand=True,
                        alignment=ft.alignment.center,
                        padding=30,
                        bgcolor=MAIN_CONTENT_BG_COLOR,
                        content=ft.Column(
                            [
                                ft.Text("Iniciar Sesión", size=32, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                ft.Container(height=20),
                                ft.Text("Redirigiendo...", size=20, color=PRIMARY_ACCENT_COLOR),
                                ft.TextButton("¿No tienes cuenta? Regístrate aquí.", on_click=lambda _: page.go("/signup"))
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                            width=350
                        )
                    )
                ], expand=True
            )
        ]
    )

def view_signup(page: ft.Page) -> ft.View:
    """Vista para el registro de un nuevo usuario, ahora por pasos."""
    # Controles para el Paso 1
    username_field = ft.TextField(label="Usuario", icon=ft.Icons.PERSON, autofocus=True)
    password_field = ft.TextField(label="Contraseña", password=True, can_reveal_password=True, icon=ft.Icons.LOCK)
    # Controles para el Paso 2 (inicialmente invisibles)
    full_name_field = ft.TextField(label="Nombre Completo", icon=ft.Icons.BADGE, visible=False)
    address_field = ft.TextField(label="Dirección", icon=ft.Icons.HOME, visible=False)
    credit_card_field = ft.TextField(label="Tarjeta de Crédito", icon=ft.Icons.CREDIT_CARD, password=True, can_reveal_password=True, visible=False)
    # Botones
    return ft.View(
        "/signup",
        [
            ft.Row(
                [
                    render_sidebar_container(page),
                    ft.Text("Registro deshabilitado", size=20, color=PRIMARY_ACCENT_COLOR),
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                width=350
            )
        ]
    )

def view_checkout(page: ft.Page):
    """Vista de finalización de compra y pago."""
    sidebar_container = render_sidebar_container(page)
    
    total_cart_price = sum(
        (item_data["item"].get("price", 0.0) * (item_data.get("hours", 0) + (0.5 if item_data.get("half_hour", False) else 0)) * item_data.get("quantity", 0))
        for item_data in app_state["cart_items"].values()
    )

    def process_payment(e):
        # Simula el procesamiento del pago
        logging.info("Procesando pago...")
        
        # Guarda la orden
        order_id = str(uuid.uuid4())
        order = {
            "order_id": order_id,
            "user": app_state["current_user"]["username"] if app_state["current_user"] else "Invitado",
            "items": [
                {
                    "name": item_data["item"]["name"],
                    "quantity": item_data["quantity"],
                    "hours": item_data.get("hours", 0),
                    "half_hour": item_data.get("half_hour", False),
                    "price_per_hour": item_data["item"]["price"]
                } for item_data in app_state["cart_items"].values()
            ],
            "total_price": total_cart_price,
            "status": "Completado"
        }
        app_state["orders"].append(order)
        save_orders(page)
        
        # Vacía el carrito
        clear_cart(page)

        # Muestra un mensaje de éxito
        show_snackbar(page, "¡Pago exitoso! Gracias por tu compra. 🎉", info=True)
        page.go("/") # Redirigir al inicio después de pagar

    return ft.View(
        "/checkout",
        [
            ft.Row(
                [
                    sidebar_container,
                    ft.Container(
                        expand=True,
                        alignment=ft.alignment.center,
                        padding=30,
                        bgcolor=MAIN_CONTENT_BG_COLOR,
                        content=ft.Column(
                            [
                                ft.Text("Finalizar Compra 💳", size=32, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                ft.Container(height=20),
                                ft.Text(f"Total a pagar: {format_price(total_cart_price)}", size=24, weight=ft.FontWeight.BOLD, color=PRIMARY_ACCENT_COLOR),
                                ft.Container(height=20),
                                ft.Text("Detalles de tu carrito:", weight=ft.FontWeight.BOLD),
                                ft.Column(
                                    [
                                        ft.Text(f"- {item['item']['name']} ({item['quantity']} unidades) por {item['hours']} horas", size=16)
                                        for item in app_state['cart_items'].values()
                                    ]
                                ),
                                ft.Container(height=30),
                                ft.ElevatedButton(
                                    "Confirmar Pago",
                                    icon=ft.Icons.PAYMENT_ROUNDED,
                                    on_click=process_payment,
                                    bgcolor=PRIMARY_ACCENT_COLOR,
                                    color=ft.Colors.WHITE,
                                    style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=15, horizontal=25), shape=ft.RoundedRectangleBorder(radius=10))
                                )
                            ],
                            alignment=ft.MainAxisAlignment.CENTER,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                            width=500
                        )
                    )
                ], expand=True
            )
        ]
    )


# -----------------------------
# Funciones de Lógica de Negocio del Admin
# -----------------------------
def add_product(page: ft.Page, new_product: Dict[str, Any]):
    """Añade un nuevo producto al catálogo."""
    category = new_product.get('category')
    if category not in app_state["products_data"]:
        app_state["products_data"][category] = []
    
    new_product["id"] = str(uuid.uuid4())
    app_state["products_data"][category].append(new_product)
    save_products_data(page)
    show_snackbar(page, f"Producto '{new_product['name']}' añadido con éxito.", info=True)
    page.go("/admin_dashboard")

def delete_product(page: ft.Page, category: str, product_id: str):
    """Elimina un producto del catálogo por su ID."""
    app_state["products_data"][category] = [p for p in app_state["products_data"][category] if p["id"] != product_id]
    save_products_data(page)
    show_snackbar(page, "Producto eliminado con éxito.", info=True)
    page.update()  # <-- Actualiza la página
    page.go("/admin_dashboard")

def delete_user(page: ft.Page, username: str):
    """Elimina un usuario por su nombre de usuario."""
    if username in app_state["all_users"]:
        del app_state["all_users"][username]
        page.client_storage.set(USERS_DATA_STORAGE_KEY, json.dumps(app_state["all_users"]))
        show_snackbar(page, f"Usuario '{username}' eliminado con éxito.", info=True)
        page.update()  # <-- Actualiza la página
        page.go("/admin_dashboard")

# -----------------------------
# Tablero de Admin
# -----------------------------
def admin_dashboard_view(page: ft.Page) -> ft.View:
    """Vista principal del tablero de administración."""
    sidebar_container = render_sidebar_container(page)

    # Contenido del tablero
    total_users = len(app_state["all_users"])
    total_products = sum(len(products) for products in app_state["products_data"].values())
    total_orders = len(app_state["orders"])

    stats_cards = ft.Row(
        [
            ft.Card(
                content=ft.Container(
                    padding=ft.padding.all(20),
                    content=ft.Column(
                        [
                            ft.Text("Total Usuarios", weight=ft.FontWeight.BOLD, size=18),
                            ft.Text(str(total_users), size=32, weight=ft.FontWeight.BOLD, color=PRIMARY_ACCENT_COLOR)
                        ],
                        alignment=ft.MainAxisAlignment.CENTER,
                        spacing=10
                    ),
                    bgcolor=ft.Colors.WHITE,
                    border_radius=ft.border_radius.all(10)
                ),
                elevation=2,
                margin=ft.margin.all(10),
                col={"xs": 12, "sm": 6, "md": 4}
            ),
            ft.Card(
                content=ft.Container(
                    padding=ft.padding.all(20),
                    content=ft.Column(
                        [
                            ft.Text("Total Productos", weight=ft.FontWeight.BOLD, size=18),
                            ft.Text(str(total_products), size=32, weight=ft.FontWeight.BOLD, color=PRIMARY_ACCENT_COLOR)
                        ],
                        alignment=ft.MainAxisAlignment.CENTER,
                        spacing=10
                    ),
                    bgcolor=ft.Colors.WHITE,
                    border_radius=ft.border_radius.all(10)
                ),
                elevation=2,
                margin=ft.margin.all(10),
                col={"xs": 12, "sm": 6, "md": 4}
            ),
            ft.Card(
                content=ft.Container(
                    padding=ft.padding.all(20),
                    content=ft.Column(
                        [
                            ft.Text("Total Órdenes", weight=ft.FontWeight.BOLD, size=18),
                            ft.Text(str(total_orders), size=32, weight=ft.FontWeight.BOLD, color=PRIMARY_ACCENT_COLOR)
                        ],
                        alignment=ft.MainAxisAlignment.CENTER,
                        spacing=10
                    ),
                    bgcolor=ft.Colors.WHITE,
                    border_radius=ft.border_radius.all(10)
                ),
                elevation=2,
                margin=ft.margin.all(10),
                col={"xs": 12, "sm": 6, "md": 4}
            )
        ],
        alignment=ft.MainAxisAlignment.CENTER,
        spacing=20,
        run_spacing=20
    )

    # Tabla de productos
    def product_data_table(page: ft.Page):
        """Crea una tabla con los datos de los productos para el administrador."""
        headers = ["ID", "Nombre", "Precio", "Categoría", "Acciones"]
        rows = []
        for category, products in app_state["products_data"].items():
            for product in products:
                product_id = product.get("id")
                rows.append(
                    ft.DataRow(
                        cells=[
                            ft.DataCell(ft.Text(product_id[:8] + "...")),  # Muestra solo los primeros 8 caracteres
                            ft.DataCell(ft.Text(product.get("name", "Sin Nombre"))),
                            ft.DataCell(ft.Text(format_price(product.get("price", 0.0)))),
                            ft.DataCell(ft.Text(product.get("category", "Sin Categoría"))),
                            ft.DataCell(
                                ft.Row(
                                    [
                                        ft.IconButton(
                                            ft.Icons.EDIT,
                                            on_click=lambda e, prod=product: open_edit_product_dialog(page, prod),
                                            tooltip="Editar producto"
                                        ),
                                        ft.IconButton(
                                            ft.Icons.DELETE,
                                            on_click=lambda e, prod=product: delete_product(page, prod.get("category"), prod.get("id")),
                                            tooltip="Eliminar producto",
                                            icon_color=ft.Colors.RED_ACCENT_700
                                        )
                                    ],
                                    alignment=ft.MainAxisAlignment.CENTER,
                                    spacing=10
                                )
                            )
                        ]
                    )
                )
        return ft.DataTable(
            columns=[ft.DataColumn(ft.Text(header)) for header in headers],
            rows=rows,
            column_spacing=10,
            horizontal_lines=True,
            vertical_lines=True,
            border_radius=ft.border_radius.all(10),
            bgcolor=ft.Colors.WHITE,
            elevation=2,
            heading_row_height=50,
            row_height=50,
            heading_row_color=ft.Colors.BLUE_GREY_100
        )

    # Contenido principal del tablero
    return ft.View(
        "/admin_dashboard",
        [
            ft.Row(
                [
                    sidebar_container,
                    ft.Container(
                        expand=True,
                        padding=ft.padding.all(30),
                        content=ft.Column(
                            [
                                ft.Text("Tablero de Administración", size=32, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                ft.Container(height=20),
                                stats_cards,
                                ft.Container(height=30),
                                ft.Text("Gestión de Productos", size=24, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                ft.Container(
                                    content=product_data_table(page),
                                    expand=True,
                                    padding=ft.padding.all(10),
                                    border_radius=ft.border_radius.all(10),
                                    bgcolor=ft.Colors.WHITE,
                                    elevation=2
                                )
                            ],
                            spacing=20,
                            alignment=ft.MainAxisAlignment.START,
                            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                            expand=True,
                            scroll=ft.ScrollMode.AUTO,
                        ),
                        bgcolor=MAIN_CONTENT_BG_COLOR,
                        border_radius=ft.border_radius.all(10)
                    )
                ], expand=True
            )
        ],
        bgcolor=INNER_CONTENT_BG_COLOR
    )

def open_edit_product_dialog(page: ft.Page, product: Dict[str, Any]):
    """Abre el diálogo para editar un producto existente."""
    product_id = product.get("id")
    product_name = product.get("name")
    product_price = product.get("price")
    product_url = product.get("url")
    product_category = product.get("category")
    product_description = product.get("description")
    product_images = product.get("images", [])
    product_specs = product.get("specs", {})

    # Campos del formulario
    product_name_tf = ft.TextField(label="Nombre del Producto", value=product_name, icon=ft.Icons.PERSON)
    product_price_tf = ft.TextField(label="Precio", value=str(product_price), icon=ft.Icons.MONEY)
    product_url_tf = ft.TextField(label="URL de la Imagen Principal", value=product_url, icon=ft.Icons.LINK)
    product_category_dd = ft.Dropdown(
        label="Categoría",
        options=[
            ft.dropdown.Option("motos", "Motos"),
            ft.dropdown.Option("cars", "Carros")
        ],
        value=product_category,
        icon=ft.Icons.CATEGORY
    )
    product_description_tf = ft.TextField(
        label="Descripción",
        value=product_description,
        icon=ft.Icons.DESCRIPTION,
        multiline=True
    )
    product_images_tf = ft.TextField(
        label="Imágenes (separadas por comas)",
        value=", ".join(product_images),
        icon=ft.Icons.PICTURE_IN_PICTURE,
        multiline=True
    )
    product_specs_tf = ft.TextField(label="Especificaciones (clave:valor por línea)", multiline=True)

    # Rellenar el campo de especificaciones con el formato adecuado
    if product_specs:
        specs_text = "\n".join([f"{key}: {value}" for key, value in product_specs.items()])
        product_specs_tf.value = specs_text

    # Diálogo para editar producto
    dialog = ft.AlertDialog(
        modal=True,
        title=ft.Text("Editar Producto", size=20, weight=ft.FontWeight.BOLD),
        content=ft.Column(
            [
                product_name_tf,
                product_price_tf,
                product_url_tf,
                product_category_dd,
                product_description_tf,
                product_images_tf,
                product_specs_tf,
                ft.Row(
                    [
                        ft.ElevatedButton(
                            "Guardar Cambios",
                            on_click=lambda e: handle_edit_product(e, product_id, product_name_tf, product_price_tf, product_url_tf, product_category_dd, product_description_tf, product_images_tf, product_specs_tf, page),
                            icon=ft.Icons.SAVE
                        ),
                        ft.TextButton("Cancelar", on_click=lambda e: dialog.close())
                    ],
                    alignment=ft.MainAxisAlignment.END,
                    spacing=10
                )
            ],
            spacing=15,
            expand=True
        ),
        actions=[],
        on_dismiss=lambda e: page.update()
    )

    # Mostrar el diálogo
    page.dialog = dialog
    dialog.open = True
    dialog.update()

def handle_edit_product(e, product_id, product_name_tf, product_price_tf, product_url_tf, product_category_dd, product_description_tf, product_images_tf, product_specs_tf, page):
    """Maneja la lógica para editar un producto."""
    if not all([product_name_tf.value, product_price_tf.value, product_category_dd.value]):
        show_snackbar(page, "Por favor, completa los campos obligatorios.", error=True)
        return
    
    try:
        price = float(product_price_tf.value)
    except ValueError:
        show_snackbar(page, "El precio debe ser un número válido.", error=True)
        return

    # Procesar especificaciones
    specs = {}
    if product_specs_tf.value:
        for line in product_specs_tf.value.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                specs[k.strip()] = v.strip()

    updated_product_data = {
        "name": product_name_tf.value,
        "price": price,
        "url": product_url_tf.value,
        "category": product_category_dd.value,
        "description": product_description_tf.value,
        "images": [url.strip() for url in product_images_tf.value.split(',')] if product_images_tf.value else [],
        "specs": specs
    }

    # Actualizar el producto en el estado global
    for category, products in app_state["products_data"].items():
        for product in products:
            if product["id"] == product_id:
                product.update(updated_product_data)
                break

    save_products_data(page)
    show_snackbar(page, "Producto actualizado con éxito.", info=True)
    page.update()  # <-- Actualiza la página después de editar
    page.go("/admin_dashboard") # Forzar la recarga de la vista

def admin_orders_view(page: ft.Page):
    """Vista para gestionar órdenes desde el tablero de admin."""
    sidebar_container = render_sidebar_container(page)

    if not app_state["orders"]:
        return ft.View(
            "/admin_orders",
            [
                ft.Row(
                    [
                        sidebar_container,
                        ft.Container(
                            expand=True,
                            alignment=ft.alignment.center,
                            padding=ft.padding.all(30),
                            bgcolor=MAIN_CONTENT_BG_COLOR,
                            content=ft.Column(
                                [
                                    ft.Icon(ft.Icons.REMOVE_SHOPPING_CART, size=120, color=ft.Colors.BLUE_GREY_300),
                                    ft.Text("No hay órdenes aún.", size=28, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_600),
                                    ft.Text("Las órdenes aparecerán aquí una vez que haya compras.", size=18, color=ft.Colors.BLUE_GREY_400),
                                    ft.Container(height=30),
                                    ft.ElevatedButton(
                                        "Volver al Tablero",
                                        icon=ft.Icons.ARROW_BACK,
                                        on_click=lambda _: page.go("/admin_dashboard"),
                                        style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=15, horizontal=30), shape=ft.RoundedRectangleBorder(radius=10))
                                    )
                                ],
                                spacing=20,
                                alignment=ft.MainAxisAlignment.CENTER,
                                horizontal_alignment=ft.CrossAxisAlignment.CENTER
                            )
                        )
                    ], expand=True
                )
            ],
            bgcolor=INNER_CONTENT_BG_COLOR
        )
    else:
        # Tabla de órdenes
        def order_data_table(page: ft.Page):
            """Crea una tabla con los datos de las órdenes para el administrador."""
            headers = ["ID", "Usuario", "Total", "Estado", "Acciones"]
            rows = []
            for order in app_state["orders"]:
                order_id = order.get("order_id")
                username = order.get("user", "Invitado")
                total_price = order.get("total_price", 0.0)
                status = order.get("status", "Desconocido")

                rows.append(
                    ft.DataRow(
                        cells=[
                            ft.DataCell(ft.Text(order_id[:8] + "...")),  # Muestra solo los primeros 8 caracteres
                            ft.DataCell(ft.Text(username)),
                            ft.DataCell(ft.Text(format_price(total_price))),
                            ft.DataCell(ft.Text(status)),
                            ft.DataCell(
                                ft.Row(
                                    [
                                        ft.IconButton(
                                            ft.Icons.DELETE,
                                            on_click=lambda e, ord=order: delete_order(page, ord.get("order_id")),
                                            tooltip="Eliminar orden",
                                            icon_color=ft.Colors.RED_ACCENT_700
                                        )
                                    ],
                                    alignment=ft.MainAxisAlignment.CENTER,
                                    spacing=10
                                )
                            )
                        ]
                    )
                )
            return ft.DataTable(
                columns=[ft.DataColumn(ft.Text(header)) for header in headers],
                rows=rows,
                column_spacing=10,
                horizontal_lines=True,
                vertical_lines=True,
                border_radius=ft.border_radius.all(10),
                bgcolor=ft.Colors.WHITE,
                elevation=2,
                heading_row_height=50,
                row_height=50,
                heading_row_color=ft.Colors.BLUE_GREY_100
            )

        # Contenido principal de la vista de órdenes
        return ft.View(
            "/admin_orders",
            [
                ft.Row(
                    [
                        sidebar_container,
                        ft.Container(
                            expand=True,
                            padding=ft.padding.all(30),
                            content=ft.Column(
                                [
                                    ft.Text("Gestión de Órdenes", size=32, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                    ft.Container(height=20),
                                    ft.Text("Órdenes Recientes", size=24, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                    ft.Container(
                                        content=order_data_table(page),
                                        expand=True,
                                        padding=ft.padding.all(10),
                                        border_radius=ft.border_radius.all(10),
                                        bgcolor=ft.Colors.WHITE,
                                        elevation=2
                                    ),
                                    ft.Container(height=20),
                                    ft.ElevatedButton(
                                        "Volver al Tablero",
                                        icon=ft.Icons.ARROW_BACK,
                                        on_click=lambda _: page.go("/admin_dashboard"),
                                        style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=15, horizontal=30), shape=ft.RoundedRectangleBorder(radius=10))
                                    )
                                ],
                                spacing=20,
                                alignment=ft.MainAxisAlignment.START,
                                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                                expand=True,
                                scroll=ft.ScrollMode.AUTO,
                            ),
                            bgcolor=MAIN_CONTENT_BG_COLOR,
                            border_radius=ft.border_radius.all(10)
                        )
                    ], expand=True
                )
            ],
            bgcolor=INNER_CONTENT_BG_COLOR
        )

def delete_order(page: ft.Page, order_id: str):
    """Elimina una orden por su ID."""
    app_state["orders"] = [order for order in app_state["orders"] if order["order_id"] != order_id]
    save_orders(page)
    show_snackbar(page, "Orden eliminada con éxito.", info=True)
    page.update()  # <-- Actualiza la página
    page.go("/admin_orders")

def admin_users_view(page: ft.Page):
    """Vista para gestionar usuarios desde el tablero de admin."""
    sidebar_container = render_sidebar_container(page)

    if not app_state["all_users"]:
        return ft.View(
            "/admin_users",
            [
                ft.Row(
                    [
                        sidebar_container,
                        ft.Container(
                            expand=True,
                            alignment=ft.alignment.center,
                            padding=ft.padding.all(30),
                            bgcolor=MAIN_CONTENT_BG_COLOR,
                            content=ft.Column(
                                [
                                    ft.Icon(ft.Icons.REMOVE_PEOPLE, size=120, color=ft.Colors.BLUE_GREY_300),
                                    ft.Text("No hay usuarios registrados aún.", size=28, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_600),
                                    ft.Text("Los usuarios aparecerán aquí una vez que se registren.", size=18, color=ft.Colors.BLUE_GREY_400),
                                    ft.Container(height=30),
                                    ft.ElevatedButton(
                                        "Volver al Tablero",
                                        icon=ft.Icons.ARROW_BACK,
                                        on_click=lambda _: page.go("/admin_dashboard"),
                                        style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=15, horizontal=30), shape=ft.RoundedRectangleBorder(radius=10))
                                    )
                                ],
                                spacing=20,
                                alignment=ft.MainAxisAlignment.CENTER,
                                horizontal_alignment=ft.CrossAxisAlignment.CENTER
                            )
                        )
                    ], expand=True
                )
            ],
            bgcolor=INNER_CONTENT_BG_COLOR
        )
    else:
        # Tabla de usuarios
        def user_data_table(page: ft.Page):
            """Crea una tabla con los datos de los usuarios para el administrador."""
            headers = ["Usuario", "Nombre Completo", "Dirección", "Acciones"]
            rows = []
            for username, user in app_state["all_users"].items():
                rows.append(
                    ft.DataRow(
                        cells=[
                            ft.DataCell(ft.Text(username)),
                            ft.DataCell(ft.Text(user.get("full_name", "Sin Nombre"))),
                            ft.DataCell(ft.Text(user.get("address", "Sin Dirección"))),
                            ft.DataCell(
                                ft.Row(
                                    [
                                        ft.IconButton(
                                            ft.Icons.DELETE,
                                            on_click=lambda e, user=user: delete_user(page, user.get("username")),
                                            tooltip="Eliminar usuario",
                                            icon_color=ft.Colors.RED_ACCENT_700
                                        )
                                    ],
                                    alignment=ft.MainAxisAlignment.CENTER,
                                    spacing=10
                                )
                            )
                        ]
                    )
                )
            return ft.DataTable(
                columns=[ft.DataColumn(ft.Text(header)) for header in headers],
                rows=rows,
                column_spacing=10,
                horizontal_lines=True,
                vertical_lines=True,
                border_radius=ft.border_radius.all(10),
                bgcolor=ft.Colors.WHITE,
                elevation=2,
                heading_row_height=50,
                row_height=50,
                heading_row_color=ft.Colors.BLUE_GREY_100
            )

        # Contenido principal de la vista de usuarios
        return ft.View(
            "/admin_users",
            [
                ft.Row(
                    [
                        sidebar_container,
                        ft.Container(
                            expand=True,
                            padding=ft.padding.all(30),
                            content=ft.Column(
                                [
                                    ft.Text("Gestión de Usuarios", size=32, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                    ft.Container(height=20),
                                    ft.Text("Usuarios Registrados", size=24, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                                    ft.Container(
                                        content=user_data_table(page),
                                        expand=True,
                                        padding=ft.padding.all(10),
                                        border_radius=ft.border_radius.all(10),
                                        bgcolor=ft.Colors.WHITE,
                                        elevation=2
                                    ),
                                    ft.Container(height=20),
                                    ft.ElevatedButton(
                                        "Volver al Tablero",
                                        icon=ft.Icons.ARROW_BACK,
                                        on_click=lambda _: page.go("/admin_dashboard"),
                                        style=ft.ButtonStyle(padding=ft.padding.symmetric(vertical=15, horizontal=30), shape=ft.RoundedRectangleBorder(radius=10))
                                    )
                                ],
                                spacing=20,
                                alignment=ft.MainAxisAlignment.START,
                                horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                                expand=True,
                                scroll=ft.ScrollMode.AUTO,
                            ),
                            bgcolor=MAIN_CONTENT_BG_COLOR,
                            border_radius=ft.border_radius.all(10)
                        )
                    ], expand=True
                )
            ],
            bgcolor=INNER_CONTENT_BG_COLOR
        )

def view_profile(page: ft.Page) -> ft.View:
    """Vista básica de perfil de usuario."""
    sidebar_container = render_sidebar_container(page)
    user = app_state.get("current_user", {})
    return ft.View(
        "/profile",
        [
            ft.Row([
                sidebar_container,
                ft.Container(
                    expand=True,
                    alignment=ft.alignment.center,
                    padding=30,
                    bgcolor=MAIN_CONTENT_BG_COLOR,
                    content=ft.Column([
                        ft.Text("Mi Perfil 👤", size=32, weight=ft.FontWeight.BOLD, color=ft.Colors.BLUE_GREY_800),
                        ft.Text(f"Usuario: {user.get('username', 'Sin usuario')}"),
                        ft.Text(f"Nombre: {user.get('full_name', 'Sin nombre')}"),
                        ft.Text(f"Dirección: {user.get('address', 'Sin dirección')}"),
                        ft.Text(f"Tarjeta: {user.get('credit_card', 'Sin tarjeta')}"),
                    ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER)
                )
            ], expand=True)
        ]
    )

def main(page: ft.Page):
    page.title = "Tienda de Vehículos"
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
    page.vertical_alignment = ft.MainAxisAlignment.CENTER
    page.theme_mode = ft.ThemeMode.LIGHT

    # Cargar datos iniciales
    save_products_data(page)
    load_cart_from_storage(page)
    load_user_data(page)
    try:
        orders_json = page.client_storage.get(ORDERS_STORAGE_KEY)
        if orders_json:
            app_state["orders"] = json.loads(orders_json)
    except Exception:
        app_state["orders"] = []

    # Función para manejar el cambio de ruta
    def route_change(e):
        page.views.clear()
        page.views.append(view_main(page))
        route = page.route

        if route == "/login":
            page.views.append(view_login(page))
        elif route == "/signup":
            page.views.append(view_signup(page))
        elif route == "/cart":
            page.views.append(view_cart(page))
        elif route == "/checkout":
            page.views.append(view_checkout(page))
        elif route == "/admin_dashboard":
            page.views.append(admin_dashboard_view(page))
        elif route == "/admin_orders":
            page.views.append(admin_orders_view(page))
        elif route == "/admin_users":
            page.views.append(admin_users_view(page))
        elif route == "/profile":
            page.views.append(view_profile(page))
        elif route.startswith("/motos"):
            parts = route.split("/")
            if len(parts) == 3 and parts[2]:
                page.views.append(view_product_details("motos", parts[2], page))
            else:
                page.views.append(view_products("motos", page))
        elif route.startswith("/cars"):
            parts = route.split("/")
            if len(parts) == 3 and parts[2]:
                page.views.append(view_product_details("cars", parts[2], page))
            else:
                page.views.append(view_products("cars", page))

        page.update()

    page.on_route_change = route_change
    page.go(page.route)
ft.app(target=main)
def save_products_data(page: ft.Page):
    """Carga los datos de productos desde el almacenamiento o los inicializa."""
    try:
        stored_data = page.client_storage.get(PRODUCTS_STORAGE_KEY)
        if stored_data:
            app_state["products_data"] = json.loads(stored_data)
            logging.info("Datos de productos cargados desde el almacenamiento.")
        else:
            # Inicializa con categorías vacías si no hay nada guardado
            app_state["products_data"] = {
                "motos": [],
                "cars": []
            }
            logging.info("Datos de productos inicializados por defecto.")
    except Exception as e:
        logging.error(f"Error al cargar los datos de productos: {e}")
        app_state["products_data"] = {}