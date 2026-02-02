'use client';

import Link from 'next/link';
import Footer from '../_components/Footer';

export default function TerminosPage() {
  return (
    <div className="ce-public-shell ce-public-bg min-h-screen flex flex-col">
      <div className="relative flex-1 mx-auto w-full max-w-4xl px-6 py-14">
        <div className="mb-6">
          <Link href="/" className="text-sm text-fuchsia-300 hover:text-fuchsia-200">
            ← Volver al inicio
          </Link>
        </div>

        <div className="ce-card p-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="ce-title-gradient">Términos y Condiciones</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Última actualización: Febrero 2026</p>

          <div className="mt-8 space-y-8 text-sm text-zinc-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar la plataforma CiberEduca, aceptas estar sujeto a estos Términos y Condiciones 
                de uso, todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, 
                no debes utilizar este servicio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">2. Descripción del Servicio</h2>
              <p>
                CiberEduca es una plataforma educativa gamificada diseñada para estudiantes y maestros de secundaria. 
                El servicio incluye:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
                <li>Acceso a talleres educativos con contenido multimedia</li>
                <li>Tests y evaluaciones con diferentes tipos de preguntas</li>
                <li>Sistema de gamificación con XP, niveles, medallas y rankings</li>
                <li>Personalización de avatares</li>
                <li>Herramientas para maestros para crear y gestionar contenido</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">3. Registro y Cuentas de Usuario</h2>
              <p>Para utilizar CiberEduca debes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
                <li>Proporcionar información veraz y actualizada</li>
                <li>Mantener la confidencialidad de tu contraseña</li>
                <li>Ser estudiante o personal autorizado de una institución educativa participante</li>
                <li>Si eres menor de edad, contar con el consentimiento de tu padre, madre o tutor legal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">4. Usuarios Menores de Edad</h2>
              <p>
                CiberEduca está diseñado principalmente para estudiantes de secundaria (menores de edad). 
                De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares 
                (LFPDPPP), el tratamiento de datos personales de menores requiere el consentimiento de los padres 
                o tutores legales.
              </p>
              <p className="mt-2">
                Al crear una cuenta para un menor, el padre, madre o tutor legal acepta estos términos en su nombre 
                y se hace responsable del uso que el menor haga de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">5. Uso Aceptable</h2>
              <p>Al usar CiberEduca, te comprometes a:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
                <li>Usar la plataforma únicamente con fines educativos</li>
                <li>No compartir tu cuenta con otras personas</li>
                <li>No intentar acceder a cuentas de otros usuarios</li>
                <li>No subir contenido inapropiado, ofensivo o ilegal</li>
                <li>No interferir con el funcionamiento normal de la plataforma</li>
                <li>Respetar a otros usuarios y al personal educativo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">6. Propiedad Intelectual</h2>
              <p>
                Todo el contenido de CiberEduca, incluyendo pero no limitado a textos, gráficos, logos, 
                iconos, imágenes, clips de audio y software, es propiedad de CiberEduca o de sus proveedores 
                de contenido y está protegido por las leyes de propiedad intelectual.
              </p>
              <p className="mt-2">
                El contenido educativo creado por los maestros dentro de la plataforma permanece bajo su 
                autoría, otorgando a CiberEduca una licencia para su uso dentro de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">7. Privacidad y Protección de Datos</h2>
              <p>
                El tratamiento de tus datos personales se rige por nuestra{' '}
                <Link href="/privacidad" className="text-fuchsia-300 hover:text-fuchsia-200 underline">
                  Política de Privacidad
                </Link>
                , la cual forma parte integral de estos Términos y Condiciones.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">8. Limitación de Responsabilidad</h2>
              <p>
                CiberEduca se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio 
                será ininterrumpido, oportuno, seguro o libre de errores.
              </p>
              <p className="mt-2">
                En ningún caso CiberEduca será responsable por daños indirectos, incidentales, especiales o 
                consecuentes que resulten del uso o la imposibilidad de uso del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">9. Modificaciones</h2>
              <p>
                Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. 
                Las modificaciones entrarán en vigor inmediatamente después de su publicación en la plataforma. 
                Tu uso continuado del servicio después de cualquier modificación constituye tu aceptación de 
                los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">10. Terminación</h2>
              <p>
                Podemos suspender o terminar tu acceso a CiberEduca en cualquier momento, sin previo aviso, 
                por cualquier motivo, incluyendo pero no limitado a la violación de estos Términos y Condiciones.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">11. Ley Aplicable</h2>
              <p>
                Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes de los 
                Estados Unidos Mexicanos, sin dar efecto a ningún principio de conflictos de leyes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">12. Contacto</h2>
              <p>
                Si tienes preguntas sobre estos Términos y Condiciones, puedes contactarnos a través de 
                la administración de tu institución educativa.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link href="/privacidad" className="ce-btn ce-btn-ghost">
            Política de Privacidad
          </Link>
          <Link href="/cookies" className="ce-btn ce-btn-ghost">
            Política de Cookies
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
