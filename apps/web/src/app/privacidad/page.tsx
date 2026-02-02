'use client';

import Link from 'next/link';
import Footer from '../_components/Footer';

export default function PrivacidadPage() {
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
            <span className="ce-title-gradient">Aviso de Privacidad</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Última actualización: Febrero 2026</p>

          <div className="mt-4 p-4 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
            <p className="text-sm text-fuchsia-200">
              Este aviso de privacidad cumple con la Ley Federal de Protección de Datos Personales 
              en Posesión de los Particulares (LFPDPPP) y su Reglamento.
            </p>
          </div>

          <div className="mt-8 space-y-8 text-sm text-zinc-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">1. Identidad del Responsable</h2>
              <p>
                CiberEduca, con domicilio en [Dirección de la institución educativa], es responsable 
                del tratamiento de los datos personales que nos proporciones, los cuales serán protegidos 
                conforme a lo dispuesto por la LFPDPPP.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">2. Datos Personales que Recabamos</h2>
              <p>Para las finalidades señaladas en este aviso, recabamos las siguientes categorías de datos:</p>
              
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <h3 className="font-semibold text-zinc-200">Datos de identificación:</h3>
                  <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                    <li>Nombre de usuario</li>
                    <li>Correo electrónico (opcional)</li>
                    <li>Grado escolar y grupo</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <h3 className="font-semibold text-zinc-200">Datos de autenticación:</h3>
                  <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                    <li>Contraseña (almacenada de forma encriptada)</li>
                    <li>Tokens de sesión</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <h3 className="font-semibold text-zinc-200">Datos de uso de la plataforma:</h3>
                  <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                    <li>Progreso en talleres y tests</li>
                    <li>Puntuaciones y calificaciones</li>
                    <li>Experiencia (XP) y nivel</li>
                    <li>Medallas obtenidas</li>
                    <li>Configuración de avatar</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-200">
                <strong>Nota importante:</strong> No recabamos datos sensibles como origen étnico, 
                estado de salud, creencias religiosas, orientación sexual ni datos biométricos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">3. Finalidades del Tratamiento</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-zinc-200">Finalidades primarias (necesarias):</h3>
                  <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                    <li>Crear y administrar tu cuenta de usuario</li>
                    <li>Proporcionarte acceso a los talleres y tests educativos</li>
                    <li>Registrar tu progreso académico y calificaciones</li>
                    <li>Permitir la comunicación entre estudiantes y maestros</li>
                    <li>Gestionar el sistema de gamificación (XP, niveles, medallas)</li>
                    <li>Generar rankings y estadísticas de la clase</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-200">Finalidades secundarias (opcionales):</h3>
                  <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                    <li>Enviar notificaciones sobre tu progreso (si proporcionas email)</li>
                    <li>Mejorar la plataforma mediante análisis de uso agregado y anónimo</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">4. Transferencia de Datos</h2>
              <p>
                Tus datos personales NO serán transferidos a terceros, salvo en los siguientes casos:
              </p>
              <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                <li>Cuando sea requerido por autoridades competentes en términos de la legislación aplicable</li>
                <li>A los maestros y personal administrativo de tu institución educativa para fines académicos</li>
              </ul>
              <p className="mt-2">
                No vendemos, alquilamos ni compartimos tu información personal con terceros para fines comerciales.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">5. Derechos ARCO</h2>
              <p>
                Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (derechos ARCO) al tratamiento 
                de tus datos personales. Para ejercer estos derechos, puedes:
              </p>
              <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                <li>Modificar tu información desde la sección "Perfil" de la plataforma</li>
                <li>Solicitar la cancelación de tu cuenta a través de la administración de tu escuela</li>
                <li>Contactar al responsable de datos de tu institución educativa</li>
              </ul>

              <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <h3 className="font-semibold text-cyan-200">Para ejercer tus derechos ARCO:</h3>
                <p className="mt-2 text-cyan-100/80">
                  Presenta una solicitud por escrito a la administración de tu institución educativa, 
                  incluyendo: nombre completo, descripción clara de los datos y el derecho que deseas ejercer, 
                  y cualquier documento que facilite la localización de tus datos.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">6. Tratamiento de Datos de Menores</h2>
              <p>
                CiberEduca está diseñado para estudiantes de secundaria, muchos de los cuales son menores de edad. 
                El tratamiento de datos de menores se realiza con las siguientes consideraciones:
              </p>
              <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                <li>Se requiere el consentimiento del padre, madre o tutor legal</li>
                <li>Se minimiza la cantidad de datos recabados al mínimo necesario</li>
                <li>Los datos se utilizan exclusivamente para fines educativos</li>
                <li>Se implementan medidas de seguridad adicionales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">7. Medidas de Seguridad</h2>
              <p>
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger 
                tus datos personales:
              </p>
              <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                <li>Contraseñas encriptadas con algoritmos seguros (bcrypt)</li>
                <li>Comunicaciones cifradas mediante HTTPS</li>
                <li>Tokens de autenticación con expiración automática</li>
                <li>Cookies httpOnly que no pueden ser leídas por JavaScript</li>
                <li>Acceso restringido por roles (estudiante, maestro, admin)</li>
                <li>Aislamiento de datos por institución educativa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">8. Uso de Cookies</h2>
              <p>
                Utilizamos cookies técnicas necesarias para el funcionamiento de la plataforma. 
                Para más información, consulta nuestra{' '}
                <Link href="/cookies" className="text-fuchsia-300 hover:text-fuchsia-200 underline">
                  Política de Cookies
                </Link>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">9. Conservación de Datos</h2>
              <p>
                Tus datos personales serán conservados mientras mantengas una cuenta activa en la plataforma 
                o mientras dure tu relación con la institución educativa. Una vez finalizada esta relación, 
                los datos podrán ser conservados por el tiempo necesario para cumplir con obligaciones legales.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">10. Cambios al Aviso de Privacidad</h2>
              <p>
                Nos reservamos el derecho de efectuar modificaciones al presente aviso de privacidad. 
                Cualquier cambio será notificado a través de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">11. Contacto</h2>
              <p>
                Para cualquier duda o aclaración sobre este aviso de privacidad o el tratamiento de tus 
                datos personales, contacta a la administración de tu institución educativa.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link href="/terminos" className="ce-btn ce-btn-ghost">
            Términos y Condiciones
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
