import React, { useState, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Center } from '@react-three/drei';
import { Box } from 'lucide-react';

// Error Boundary to catch invalid .glb files and prevent the app from crashing
interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error loading 3D model:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// The actual 3D Model component
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Wenn das Modell flach liegt, hilft meistens eine Drehung um 90 Grad (Math.PI / 2) auf der X-Achse
  return <primitive object={scene} rotation={[Math.PI / 2, 0, 0]} />;
}

export default function App() {
  const [logoError, setLogoError] = useState(false);

  // Fest verankerter Pfad zum 3D-Modell (muss im Ordner "public" liegen)
  const MODEL_URL = "/model.glb";
  // Für Apple iOS (iPhones/iPads) wird zwingend das USDZ Format für AR benötigt:
  const USDZ_URL = "/model.usdz";

  const handleARClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

    if (isAndroid) {
      e.preventDefault();
      // Ruft den nativen Android 3D/AR Viewer von Google auf
      const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${window.location.origin}${MODEL_URL}&mode=ar_only#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`;
      window.location.href = intentUrl;
    } else if (isIOS) {
      // Bei iOS lassen wir den Standard-Link ("rel=ar") durchlaufen. 
      // Safari fängt diesen ab und öffnet das Modell nativ in "AR Quick Look".
    } else {
      e.preventDefault();
      alert("Die Funktion 'In AR ansehen' ist nur auf Smartphones und Tablets (Android & iOS) verfügbar.");
    }
  };

  return (
    <div className="w-screen h-screen bg-white text-neutral-900 font-sans overflow-hidden relative">
      {/* AR Button Overlay (Top Right) */}
      <div className="absolute top-6 right-6 z-20">
        <a
          rel="ar"
          href={USDZ_URL}
          onClick={handleARClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 backdrop-blur-md hover:bg-black text-white font-medium rounded-full shadow-xl transition-all hover:scale-105 pointer-events-auto border border-neutral-800"
        >
          <Box className="w-5 h-5" />
          <span className="text-sm">In AR ansehen</span>
        </a>
      </div>

      {/* Header / Logo Overlay */}
      <header className="absolute top-0 left-0 w-full p-6 flex items-center justify-center z-10 pointer-events-none">
        {!logoError ? (
          <img 
            src="/logo.png" 
            alt="Produkt Logo" 
            className="h-16 object-contain drop-shadow-md"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="text-lg font-medium tracking-tight text-neutral-500 border border-dashed border-neutral-300 px-6 py-2 rounded-md bg-white/50 backdrop-blur-sm">
            Logo Platzhalter (logo.png)
          </div>
        )}
      </header>

      {/* Main Content / 3D Canvas */}
      <main className="absolute inset-0 w-full h-full">
        <ErrorBoundary fallback={
          <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-white">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Fehler beim Laden des Modells</p>
              <p className="text-sm text-neutral-500">Bitte stelle sicher, dass die Datei <strong>{MODEL_URL}</strong> existiert.</p>
            </div>
          </div>
        }>
          <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
            <color attach="background" args={['#ffffff']} />
            <Suspense fallback={null}>
              <Stage environment="city" intensity={0.5} adjustCamera center={{ precise: true }}>
                <Model url={MODEL_URL} />
              </Stage>
            </Suspense>
            {/* OrbitControls enables rotating with the mouse */}
            <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} enablePan={false} enableZoom={false} target={[0, 0, 0]} />
          </Canvas>
        </ErrorBoundary>
      </main>
      
      {/* Overlay Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-full text-sm text-neutral-600 pointer-events-none border border-neutral-200 shadow-sm">
        <span className="font-medium text-neutral-900">Linke Maustaste:</span> Modell drehen
      </div>
    </div>
  );
}
