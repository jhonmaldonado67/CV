import flet as ft
import mysql.connector
from datetime import datetime
from IA import responder_ia  # <-- Importa la función IA correctamente

# Paleta Login
LOGIN_BG = "#0d47a1"
LOGIN_INPUT_BG = "#e3f2fd"
LOGIN_BTN_BG = "#1e88e5"
LOGIN_TEXT_COLOR = "white"

# Paleta Admin
ADMIN_BG = "#1b1b1b"
ADMIN_INPUT_BG = "white"
ADMIN_BTN_BG = "#388e3c"
ADMIN_TEXT_COLOR = "#f5f5f5"

# Paleta Mecánico
MECANICO_BG = "#212121"
MECANICO_INPUT_BG = "#2e2e2e"
MECANICO_BORDER = "#ff9800"
MECANICO_BTN_ORANGE = "#ff9800"
MECANICO_BTN_PURPLE = "#6a1b9a"
MECANICO_TEXT_COLOR = "white"

class AppState:
    def init(self):
        self.nombre_usuario = None
        self.password_usuario = None
        self.rol_usuario = None
        self.mensaje_usuario = None

# Crear instancia global del estado
app_state = AppState()

def main(page: ft.Page):
    page.title = "Login"
    page.bgcolor = LOGIN_BG
    page.vertical_alignment = ft.MainAxisAlignment.CENTER

    usuario = ft.TextField(
        label="Usuario", width=300,
        border_color="white",
        bgcolor=LOGIN_INPUT_BG,
        color="black"
    )
    password = ft.TextField(
        label="Contraseña", width=300,
        password=True,
        border_color="white",
        bgcolor=LOGIN_INPUT_BG,
        color="black"
    )
    login_btn = ft.ElevatedButton(
        "Entrar",
        on_click=login,
        bgcolor=LOGIN_BTN_BG,
        color=LOGIN_TEXT_COLOR
    )

    conexion = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="gestiondemecanica"
    )
    cursor = conexion.cursor(dictionary=True)
    usuario_logueado = {"id": None, "usuario": None, "rol": None}


    # ================== CAMPOS LOGIN ==================
    usuario = ft.TextField(
     label="Usuario", width=300,
      border_color="white", bgcolor=LOGIN_INPUT_BG, color="black"
)
    password = ft.TextField(
      label="Contraseña", width=300,
      password=True, border_color="white", bgcolor=LOGIN_INPUT_BG, color="black"
)
    mensaje = ft.Text("")

    # ================== FUNCION LOGIN ==================
    def login(e):
        cursor.execute(
            "SELECT * FROM usuarios WHERE usuario=%s AND password=%s",
            (usuario.value, password.value)
        )
        user = cursor.fetchone()
        if user:
            usuario_logueado["id"] = user["id"]
            usuario_logueado["usuario"] = user["usuario"]
            usuario_logueado["rol"] = user["rol"]
            if user["rol"] == "admin":
                mostrar_panel_admin()
            else:
                mostrar_panel_mecanico()
        else:
            mensaje.value = "Usuario o contraseña incorrectos"
            page.update()

    # Botón login (callback después de la función)
    login_btn = ft.ElevatedButton(
        "Entrar",
        on_click=login,
        bgcolor=LOGIN_BTN_BG,
        color=LOGIN_TEXT_COLOR
    )

    # Vista login
    page.add(
        ft.Column([
            ft.Text("Iniciar sesión", size=20, weight="bold"),
            usuario,
            password,
            ft.Row([login_btn], alignment=ft.MainAxisAlignment.CENTER),
            mensaje
        ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER)
    )

    # Regresar al login
    def regresar_login(e):
        usuario_logueado.update({"id": None, "usuario": None, "rol": None})
        usuario.value = ""
        password.value = ""
        mensaje.value = ""
        page.controls.clear()
        page.scroll = None
        page.vertical_alignment = ft.MainAxisAlignment.CENTER
        page.add(
            ft.Column([
                ft.Text("Iniciar sesión", size=20, weight="bold"),
                usuario,
                password,
                ft.Row([login_btn], alignment=ft.MainAxisAlignment.CENTER),
                mensaje
            ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER)
        )
        page.update()

    # =============================
    # PANEL ADMIN
    # =============================
    def mostrar_panel_admin():
        usuarios_dd = ft.Dropdown(label="Selecciona un usuario", width=400, color="black", bgcolor="white", border_color="black")
        app_state.nombre_usuario = ft.TextField(label="Usuario", width=300, bgcolor="white", border_color="black")
        app_state.password_usuario = ft.TextField(label="Contraseña", width=300, password=True, bgcolor="white", border_color="black")
        app_state.rol_usuario = ft.Dropdown(label="Rol", bgcolor="white", border_color="black", options=[
            ft.dropdown.Option("admin", "Admin"),
            ft.dropdown.Option("mecanico", "Mecánico")
        ], width=300)
        app_state.mensaje_usuario = ft.Text("")

        mecanicos_dd = ft.Dropdown(label="Selecciona un mecánico", width=400)
        datos_mecanico = ft.Text("")

        # =====================
        # IA en panel admin
        # =====================
        consulta_ia = ft.TextField(label="Consulta al asistente IA", width=350)
        respuesta_ia = ft.Text("", color="green")

        def consultar_ia(e):
            pregunta = consulta_ia.value
            if not pregunta.strip():
                respuesta_ia.value = "⚠ Por favor escribe una consulta."
            else:
                respuesta_ia.value = responder_ia(pregunta)  # Llama a la IA real
            page.update()

        consultar_ia_btn = ft.ElevatedButton(
            "Consultar IA",
            on_click=consultar_ia,
            bgcolor="purple",
            color="white",
            icon=ft.Icons.SMART_TOY  # <-- CORREGIDO: usa Icons con mayúscula
        )

        # Funciones carga usuarios/mecánicos
        def cargar_usuarios_dropdown():
            cursor.execute("SELECT id, usuario FROM usuarios")
            usuarios = cursor.fetchall()
            usuarios_dd.options = [ft.dropdown.Option(str(u["id"]), u["usuario"]) for u in usuarios]
            page.update()

        def cargar_mecanicos_dropdown():
            cursor.execute("SELECT id, usuario FROM usuarios WHERE rol='mecanico'")
            mecanicos = cursor.fetchall()
            mecanicos_dd.options = [ft.dropdown.Option(str(m["id"]), m["usuario"]) for m in mecanicos]
            page.update()

        cargar_usuarios_dropdown()
        cargar_mecanicos_dropdown()

        def cargar_usuario(e):
            id_usuario = usuarios_dd.value
            if not id_usuario:
                app_state.mensaje_usuario.value = "Selecciona un usuario"
                page.update()
                return
            cursor.execute("SELECT * FROM usuarios WHERE id=%s", (id_usuario,))
            u = cursor.fetchone()
            if u:
                app_state.nombre_usuario.value = u["usuario"]
                app_state.password_usuario.value = u["password"]
                app_state.rol_usuario.value = u["rol"]
                app_state.mensaje_usuario.value = ""
            else:
                app_state.mensaje_usuario.value = "Usuario no encontrado"
                app_state.nombre_usuario.value = app_state.password_usuario.value = app_state.rol_usuario.value = ""
            page.update()

        def mostrar_datos_mecanico(e):
            id_mecanico = mecanicos_dd.value
            if not id_mecanico:
                datos_mecanico.value = "Selecciona un mecánico"
                mostrar_vehiculos_admin(None)
                page.update()
                return
            cursor.execute("SELECT * FROM usuarios WHERE id=%s", (id_mecanico,))
            m = cursor.fetchone()
            if m:
                datos_mecanico.value = f"Usuario: {m['usuario']}\nRol: {m['rol']}"
                # Listar autos del mecánico
            else:
                datos_mecanico.value = "Mecánico no encontrado"
            
            mostrar_vehiculos_admin(id_mecanico)
            page.update()

        # Función para mostrar vehículos en admin
        vehiculos_admin_display = ft.Column([])
        def mostrar_vehiculos_admin(id_mecanico=None):
            if id_mecanico:
                cursor.execute("SELECT placa, nombre, modelo, marca, modificaciones FROM vehiculos WHERE usuario_id=%s", (id_mecanico,))
            else:
                cursor.execute("SELECT placa, nombre, modelo, marca, modificaciones FROM vehiculos")
            registros = cursor.fetchall()
            vehiculos_admin_display.controls.clear()
            
            if registros:
                for v in registros:
                    vehiculo_info = ft.Container(
                        content=ft.Column([
                            ft.Text(f"Cliente: {v['nombre']} | Placa: {v['placa']} | Marca: {v['marca']} | Modelo: {v['modelo']}", 
                                   weight="bold", size=12),
                            ft.Text(f"Modificaciones: {v['modificaciones'] or 'Sin modificaciones'}", 
                                   size=11, color="gray")
                        ]),
                        bgcolor="black",
                        padding=8,
                        margin=ft.margin.symmetric(vertical=3),
                        border_radius=5,
                        border=ft.border.all(1, "#ff5e00")
                    )
                    vehiculos_admin_display.controls.append(vehiculo_info)
            else:
                vehiculos_admin_display.controls.append(ft.Text("No hay vehículos registrados.", italic=True))
            page.update()

        def actualizar_usuario(e):
            id_usuario = usuarios_dd.value
            if not id_usuario:
                app_state.mensaje_usuario.value = "Selecciona un usuario"
                page.update()
                return
            cursor.execute("""UPDATE usuarios SET usuario=%s, password=%s, rol=%s WHERE id=%s""",
                           (app_state.nombre_usuario.value, app_state.password_usuario.value, app_state.rol_usuario.value, id_usuario))
            conexion.commit()
            app_state.mensaje_usuario.value = "Usuario actualizado correctamente"
            cargar_usuarios_dropdown()
            cargar_mecanicos_dropdown()
            page.update()

        def crear_usuario(e):
            # Validar que todos los campos estén llenos
            if not app_state.nombre_usuario.value or not app_state.password_usuario.value or not app_state.rol_usuario.value:
                app_state.mensaje_usuario.value = "Todos los campos son obligatorios"
                app_state.mensaje_usuario.color = "red"
                page.update()
                return
            
            try:
                cursor.execute("""INSERT INTO usuarios (usuario, password, rol) VALUES (%s, %s, %s)""",
                               (app_state.nombre_usuario.value, app_state.password_usuario.value, app_state.rol_usuario.value))
                conexion.commit()
                app_state.mensaje_usuario.value = "Usuario creado correctamente"
                app_state.mensaje_usuario.color = "green"
                cargar_usuarios_dropdown()
                cargar_mecanicos_dropdown()
                
                # Limpiar campos después de crear
                app_state.nombre_usuario.value = ""
                app_state.password_usuario.value = ""
                app_state.rol_usuario.value = None
                
            except mysql.connector.Error as err:
                app_state.mensaje_usuario.value = f"Error al crear usuario: {err}"
                app_state.mensaje_usuario.color = "red"
            
            page.update()

        def eliminar_usuario(e):
            id_usuario = usuarios_dd.value
            if not id_usuario:
                app_state.mensaje_usuario.value = "Selecciona un usuario"
                page.update()
                return
            cursor.execute("DELETE FROM usuarios WHERE id=%s", (id_usuario,))
            conexion.commit()
            app_state.mensaje_usuario.value = "Usuario eliminado correctamente"
            app_state.nombre_usuario.value = app_state.password_usuario.value = app_state.rol_usuario.value = ""
            cargar_usuarios_dropdown()
            cargar_mecanicos_dropdown()
            page.update()

        usuarios_dd.on_change = cargar_usuario
        mecanicos_dd.on_change = mostrar_datos_mecanico

        actualizar_usuario_btn = ft.ElevatedButton("Actualizar Usuario", on_click=actualizar_usuario,bgcolor="green", color="white")
        crear_usuario_btn = ft.ElevatedButton("Crear Usuario", on_click=crear_usuario ,bgcolor="green", color="white")
        eliminar_usuario_btn = ft.ElevatedButton("Eliminar Usuario", on_click=eliminar_usuario ,bgcolor="blue", color="white")
        regresar_login_btn = ft.ElevatedButton("Cerrar Sesión", on_click=regresar_login, bgcolor="red", color="white")

        # Vehículos registro (texto)
        vehiculos_registro = ft.Text("")
        def mostrar_registro_vehiculos():
            cursor.execute("SELECT placa, nombre, modelo, marca, modificaciones FROM vehiculos")
            registros = cursor.fetchall()
            texto = ""
            for v in registros:
                texto += f"Placa: {v['placa']}, Nombre: {v['nombre']}, Modelo: {v['modelo']}, Marca: {v['marca']}\nModificaciones: {v['modificaciones']}\n\n"
            vehiculos_registro.value = texto
            page.update()
        mostrar_registro_vehiculos()

        # Estructura 3 columnas con scroll habilitado
        page.controls.clear()
        page.scroll = ft.ScrollMode.AUTO
        page.vertical_alignment = None
        
        # Crear panel de vehículos para admin
        panel_vehiculos = panel_vehiculos_admin()
        
        page.add(
            ft.Row(
                controls=[
                    # Izquierda - Usuarios
                    ft.Column([
                        ft.Text("Usuarios", size=16, weight="bold"),
                        usuarios_dd,
                        app_state.nombre_usuario,
                        app_state.password_usuario,
                        app_state.rol_usuario,
                        actualizar_usuario_btn, crear_usuario_btn, eliminar_usuario_btn,
                        regresar_login_btn,
                        app_state.mensaje_usuario
                    ], scroll=ft.ScrollMode.AUTO, expand=1),

                    # Centro - Vehículos
                    ft.Column([
                        ft.Text("Gestión de Vehículos", size=16, weight="bold"),
                        *panel_vehiculos,
                        ft.Divider(),
                    ], scroll=ft.ScrollMode.AUTO, expand=2),

                    # Derecha - Registro arriba, luego Mecánicos y IA
                    ft.Column([
                        ft.Text("Mecánicos", size=16, weight="bold"),
                        mecanicos_dd,
                        datos_mecanico,
                        ft.Divider(),
                        ft.Text("Vehículos Registrados:", size=14, weight="bold"),
                        vehiculos_admin_display,
                        ft.Divider(),
                        ft.Text("🤖 Asistente Virtual", size=16, weight="bold", color="purple"),
                        consulta_ia,
                        consultar_ia_btn,
                        respuesta_ia
                    ], scroll=ft.ScrollMode.AUTO, expand=1),
                ],
                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                vertical_alignment=ft.CrossAxisAlignment.START
            )
        )
        page.update()

    # =============================
    # PANEL VEHÍCULOS ADMIN
    # =============================
    def panel_vehiculos_admin():
        vehiculos_dd = ft.Dropdown(label="Selecciona un vehículo", width=400, bgcolor="white", border_color="black")
        placa = ft.TextField(label="Placa", width=300, border_color="black", bgcolor="white", color="black")
        anio = ft.TextField(label="Año", width=300, border_color="black", bgcolor="white", color="black")
        nombre = ft.TextField(label="Nombre", width=300, border_color="black", bgcolor="white", color="black")
        modelo = ft.TextField(label="Modelo", width=300, border_color="black", bgcolor="white", color="black")
        marca = ft.TextField(label="Marca", width=300, border_color="black", bgcolor="white", color="black")
        historia = ft.TextField(label="Historia", width=300, multiline=True, border_color="black", bgcolor="white", color="black")
        historial = ft.TextField(label="Historial", width=300, multiline=True, border_color="black", bgcolor="white", color="black")
        modificaciones = ft.TextField(label="Modificaciones", width=300, multiline=True, border_color="black", bgcolor="white", color="black")
        email = ft.TextField(label="Email", width=300, border_color="black", bgcolor="white")
        mensaje_vehiculo = ft.Text("")

        def cargar_vehiculos_dropdown():
            cursor.execute("SELECT id, placa, nombre, modelo FROM vehiculos")
            vehiculos = cursor.fetchall()
            vehiculos_dd.options = [ft.dropdown.Option(str(v["id"]), f"{v['placa']} - {v['nombre']} {v['modelo']}") for v in vehiculos]
            page.update()

        cargar_vehiculos_dropdown()

        def cargar_vehiculo(e):
            id_vehiculo = vehiculos_dd.value
            if not id_vehiculo:
                mensaje_vehiculo.value = "Selecciona un vehículo"
                page.update()
                return
            cursor.execute("SELECT * FROM vehiculos WHERE id=%s", (id_vehiculo,))
            v = cursor.fetchone()
            if v:
                placa.value = v["placa"]
                anio.value = str(v["anio"])
                nombre.value = v["nombre"]
                modelo.value = v["modelo"]
                marca.value = v["marca"]
                historia.value = v["historia"] or ""
                historial.value = v["historial"] or ""
                modificaciones.value = v["modificaciones"] or ""
                email.value = v["email"] or ""
                mensaje_vehiculo.value = ""
            else:
                mensaje_vehiculo.value = "Vehículo no encontrado"
            page.update()

        def actualizar_vehiculo(e):
            if not vehiculos_dd.value:
                mensaje_vehiculo.value = "⚠ Selecciona un vehículo"
                page.update()
                return
            cursor.execute("""
                UPDATE vehiculos SET placa=%s, anio=%s, nombre=%s, modelo=%s, marca=%s,
                historia=%s, historial=%s, modificaciones=%s, email=%s
                WHERE id=%s
            """, (
                placa.value, int(anio.value) if anio.value.isdigit() else 1900,
                nombre.value, modelo.value, marca.value,
                historia.value, historial.value, modificaciones.value, email.value,
                vehiculos_dd.value
            ))
            conexion.commit()
            mensaje_vehiculo.value = "✅ Vehículo actualizado correctamente"
            mensaje_vehiculo.color = "green"
            page.update()

        def eliminar_vehiculo(e):
            id_vehiculo = vehiculos_dd.value
            if not id_vehiculo:
                mensaje_vehiculo.value = "Selecciona un vehículo"
                page.update()
                return
            cursor.execute("DELETE FROM vehiculos WHERE id=%s", (id_vehiculo,))
            conexion.commit()
            mensaje_vehiculo.value = "Vehículo eliminado correctamente"
            cargar_vehiculos_dropdown()
            page.update()

        vehiculos_dd.on_change = cargar_vehiculo
        actualizar_btn = ft.ElevatedButton("Actualizar Vehículo", on_click=actualizar_vehiculo, bgcolor="green", color="white")
        eliminar_btn = ft.ElevatedButton("Eliminar Vehículo", on_click=eliminar_vehiculo, bgcolor="blue", color="white")

        return [
            vehiculos_dd,
            placa, anio, nombre, modelo, marca,
            historia, historial, modificaciones, email,
            ft.Row([actualizar_btn, eliminar_btn]),
            mensaje_vehiculo
        ]

    # =============================
    # PANEL MECÁNICO
    # =============================
    def mostrar_panel_mecanico():
        vehiculos_dd = ft.Dropdown(label="Seleccionar Vehículo", width=400, color="white", bgcolor="#23272f")
        nombre = ft.TextField(label="Nombre", width=400, border_color="#ff9800", bgcolor="#23172f", color="white")
        email = ft.TextField(label="Email", width=400, border_color="#ff9800", bgcolor="#23172f", color="white")
        anio = ft.TextField(label="Año", width=400, border_color="#ff9800", bgcolor="#23172f", color="white")
        placa = ft.TextField(label="Placa", width=400, border_color="#ff9800", bgcolor="#23272f", color="white")
        modelo = ft.TextField(label="Modelo", width=400, border_color="#ff9800", bgcolor="#23272f", color="white")
        marca = ft.TextField(label="Marca", width=400, border_color="#ff9800", bgcolor="#23272f", color="white")
        modificaciones = ft.TextField(label="Modificaciones", width=400, multiline=True, max_lines=3, border_color="#ff9800", bgcolor="#23272f", color="white")
        historia = ft.TextField(label="Historia", width=400, multiline=True, border_color="#ff9800", bgcolor="#23272f", color="white")
        historial = ft.TextField(label="Historial", width=400, multiline=True, border_color="#ff9800", bgcolor="#23272f", color="white")
        mensaje_vehiculo = ft.Text("", color="#ff9800")

        # Mostrar lista de vehículos creados
        vehiculo_mecanico_display = ft.Column([], scroll=ft.ScrollMode.AUTO)

        def cargar_vehiculos_dropdown():
            cursor.execute("SELECT id, placa, nombre, modelo, marca FROM vehiculos WHERE usuario_id=%s", (usuario_logueado["id"],))
            vehiculos = cursor.fetchall()
            vehiculos_dd.options = [
                ft.dropdown.Option(str(v["id"]), f"{v['placa']} - {v['nombre']} ({v['marca']} {v['modelo']})")
                for v in vehiculos
            ]
            page.update()

        def cargar_vehiculos_display():
            cursor.execute("SELECT * FROM vehiculos WHERE usuario_id=%s", (usuario_logueado["id"],))
            registros = cursor.fetchall()
            vehiculo_mecanico_display.controls.clear()
            if registros:
                for v in registros:
                    def eliminar_este_carro(e, vid=v["id"]):
                        cursor.execute("DELETE FROM vehiculos WHERE id=%s AND usuario_id=%s", (vid, usuario_logueado["id"]))
                        conexion.commit()
                        cargar_vehiculos_dropdown()
                        cargar_vehiculos_display()
                        mensaje_vehiculo.value = "Vehículo eliminado correctamente"
                        mensaje_vehiculo.color = "#00e676"
                        page.update()
                    check = ft.Checkbox(label="Eliminar este vehículo", value=False, on_change=eliminar_este_carro)
                    vehiculo_info = ft.Container(
                        content=ft.Column([
                            ft.Text(f"Placa: {v['placa']}", weight="bold", size=14),
                            ft.Text(f"Nombre: {v['nombre']}"),
                            ft.Text(f"Modelo: {v['modelo']}"),
                            ft.Text(f"Marca: {v['marca']}"),
                            ft.Text(f"Año: {v.get('anio', '')}"),
                            ft.Text(f"Email: {v.get('email', '')}"),
                            ft.Text(f"Historia: {v.get('historia', '')}"),
                            ft.Text(f"Historial: {v.get('historial', '')}"),
                            ft.Text(f"Modificaciones: {v.get('modificaciones', '')}"),
                            check
                        ]),
                        bgcolor="purple",
                        padding=10,
                        margin=ft.margin.symmetric(vertical=5),
                        border_radius=8,
                        border=ft.border.all(3, "#f8f9fa"),
                        width=500
                    )
                    vehiculo_mecanico_display.controls.append(vehiculo_info)
            else:
                vehiculo_mecanico_display.controls.append(
                    ft.Text("No hay vehículos registrados.", italic=True)
                )
            page.update()

        def limpiar_campos_vehiculo():
            placa.value = ""
            nombre.value = ""
            modelo.value = ""
            marca.value = ""
            historia.value = ""
            historial.value = ""
            modificaciones.value = ""
            email.value = ""
            anio.value = ""

        def cargar_vehiculo(e):
            id_vehiculo = vehiculos_dd.value
            if not id_vehiculo:
                limpiar_campos_vehiculo()
                mensaje_vehiculo.value = "Selecciona un vehículo"
                page.update()
                return
            cursor.execute("SELECT * FROM vehiculos WHERE id=%s AND usuario_id=%s", (id_vehiculo, usuario_logueado["id"]))
            v = cursor.fetchone()
            if v:
                placa.value = v["placa"]
                anio.value = str(v["anio"])
                nombre.value = v["nombre"]
                modelo.value = v["modelo"]
                marca.value = v["marca"]
                historia.value = v["historia"] or ""
                historial.value = v["historial"] or ""
                modificaciones.value = v["modificaciones"] or ""
                email.value = v["email"] or ""
                mensaje_vehiculo.value = ""
            else:
                limpiar_campos_vehiculo()
                mensaje_vehiculo.value = "Vehículo no encontrado"
            page.update()

        vehiculos_dd.on_change = cargar_vehiculo

        def registrar_vehiculo(e):
            if not placa.value or not nombre.value or not modelo.value or not marca.value:
                mensaje_vehiculo.value = "Por favor complete los campos necesarios (Placa, Nombre, Modelo, Marca)"
                mensaje_vehiculo.color = "red"
                page.update()
                return
            try:
                cursor.execute("""
                    INSERT INTO vehiculos (placa, anio, nombre, marca, modelo, historia, historial, modificaciones, email, usuario_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    placa.value,
                    int(anio.value) if anio.value.isdigit() else 1900,
                    nombre.value,
                    marca.value,
                    modelo.value,
                    historia.value,
                    historial.value,
                    modificaciones.value,
                    email.value,
                    usuario_logueado["id"]
                ))
                conexion.commit()
                mensaje_vehiculo.value = "Vehículo registrado correctamente"
                mensaje_vehiculo.color = "green"
                limpiar_campos_vehiculo()
                cargar_vehiculos_dropdown()
                cargar_vehiculos_display()
            except mysql.connector.Error as err:
                mensaje_vehiculo.value = f"Error al registrar el vehículo: {err}"
                mensaje_vehiculo.color = "red"
            page.update()

        def actualizar_vehiculo(e):
            id_vehiculo = vehiculos_dd.value
            if not id_vehiculo:
                mensaje_vehiculo.value = "Selecciona un vehículo para actualizar"
                mensaje_vehiculo.color = "red"
                page.update()
                return
            try:
                cursor.execute("""
                    UPDATE vehiculos SET placa=%s, anio=%s, nombre=%s, modelo=%s, marca=%s,
                    historia=%s, historial=%s, modificaciones=%s, email=%s
                    WHERE id=%s AND usuario_id=%s
                """, (
                    placa.value, int(anio.value) if anio.value.isdigit() else 1900,
                    nombre.value, modelo.value, marca.value,
                    historia.value, historial.value, modificaciones.value, email.value,
                    id_vehiculo, usuario_logueado["id"]
                ))
                conexion.commit()
                mensaje_vehiculo.value = "Vehículo actualizado correctamente"
                mensaje_vehiculo.color = "green"
                cargar_vehiculos_dropdown()
                cargar_vehiculos_display()
            except mysql.connector.Error as err:
                mensaje_vehiculo.value = f"Error al actualizar el vehículo: {err}"
                mensaje_vehiculo.color = "red"
            page.update()

        registrar_vehiculo_btn = ft.ElevatedButton(
            "Registrar Vehículo",
            on_click=registrar_vehiculo,
            bgcolor="orange",
            color="white"
        )

        actualizar_vehiculo_btn = ft.ElevatedButton(
            "Actualizar Vehículo",
            on_click=actualizar_vehiculo,
            bgcolor="green",
            color="white"
        )

        cerrar_sesion_btn = ft.ElevatedButton(
            "Cerrar Sesión",
            on_click=regresar_login,
            bgcolor="#d32f2f",
            color="white"
        )

        # ===================== IA en panel mecánico =====================
        consulta_ia_mec = ft.TextField(label="Consulta al asistente IA", width=300, bgcolor="white", color="black")
        respuesta_ia_mec = ft.Text("", color="#00e676")

        def consultar_ia_mec(e):
            pregunta = consulta_ia_mec.value
            if not pregunta.strip():
                respuesta_ia_mec.value = "⚠ Por favor escribe una consulta."
                respuesta_ia_mec.color = "#ff1744"
            else:
                respuesta_ia_mec.value = responder_ia(pregunta)
                respuesta_ia_mec.color = "#00e676"
            page.update()

        consultar_ia_btn_mec = ft.ElevatedButton(
            "Consultar IA",
            on_click=consultar_ia_mec,
            bgcolor="#6a1b9a",
            color="white",
            icon=ft.Icons.SMART_TOY
        )

        # Inicializar lista de vehículos
        cargar_vehiculos_dropdown()
        cargar_vehiculos_display()

        page.controls.clear()
        page.scroll = ft.ScrollMode.AUTO
        page.add(
            ft.Column([
                ft.Text("Gestión de Vehículos - Mecánico", size=18, weight="bold", color="orange"),
                vehiculos_dd,
                placa, anio, nombre, modelo, marca, historia, historial, modificaciones, email,
                ft.Row([registrar_vehiculo_btn, actualizar_vehiculo_btn]),
                mensaje_vehiculo,
                ft.Divider(),
                ft.Text("Vehículos Registrados:", size=16, weight="bold", color="white"),
                vehiculo_mecanico_display,
                ft.Divider(),
                ft.Text("🤖 Asistente Virtual", size=16, weight="bold", color="#6a1b9a"),
                consulta_ia_mec,
                consultar_ia_btn_mec,
                respuesta_ia_mec,
                cerrar_sesion_btn
            ], scroll=ft.ScrollMode.AUTO, horizontal_alignment=ft.CrossAxisAlignment.CENTER)
        )
        page.update()
            

ft.app(target=main)