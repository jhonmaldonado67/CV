import cv2
import torch
import numpy as np
import warnings

# Parche para versiones recientes de PyTorch (evita el error de weights_only=True)
warnings.filterwarnings("ignore", category=FutureWarning)
original_load = torch.load
def safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = safe_load

def main():
    print("Cargando modelo YOLOv5...")
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolov5s.pt', force_reload=True)
    
    print("Iniciando c�mara web. Presiona 'q' para salir.")
    cap = cv2.VideoCapture(0)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        
        resultados = model(frame)

        frame_procesado = np.squeeze(resultados.render())

        
        cv2.imshow('Detector de Objetos - YOLOv5', frame_procesado)

        # Salir con la tecla 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()
