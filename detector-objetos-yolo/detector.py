import cv2
import torch
import numpy as np

def main():
    print("Cargando modelo YOLOv5...")
    # Cargar el modelo YOLOv5 usando los pesos locales
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolov5s.pt')
    
    print("Iniciando cámara web. Presiona 'q' para salir.")
    cap = cv2.VideoCapture(0)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Inferencia
        resultados = model(frame)

        # Dibujar los cuadros delimitadores (bounding boxes)
        frame_procesado = np.squeeze(resultados.render())

        # Mostrar la ventana
        cv2.imshow('Detector de Objetos - YOLOv5', frame_procesado)

        # Salir con la tecla 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()
