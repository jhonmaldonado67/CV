# Sistema de Detección de Objetos en Tiempo Real

Este proyecto utiliza **YOLOv5** y **OpenCV** para detectar objetos en tiempo real a través de la cámara web.

## Características
- Procesamiento de video en tiempo real usando OpenCV.
- Red neuronal convolucional (YOLOv5) para alta precisión en la detección de objetos.
- Uso de pesos locales (yolov5s.pt) para inferencia rápida sin necesidad de conexión a internet tras la descarga inicial del modelo.

## Instalación y Uso
1. Instalar las dependencias: pip install -r requirements.txt
2. Ejecutar el script: python detector.py
3. Presionar la tecla 'q' para cerrar la ventana de la cámara.
