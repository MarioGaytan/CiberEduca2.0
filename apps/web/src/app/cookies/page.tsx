'use client';

import Link from 'next/link';
import Footer from '../_components/Footer';

export default function CookiesPage() {
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
            <span className="ce-title-gradient">Política de Cookies</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Última actualización: Febrero 2026</p>

          <div className="mt-8 space-y-8 text-sm text-zinc-300 leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">1. ¿Qué son las Cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando 
                visitas un sitio web. Se utilizan para recordar información sobre tu visita, como tus 
                preferencias de idioma y otras configuraciones, lo que puede hacer que tu próxima visita 
                sea más fácil y el sitio más útil para ti.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">2. Cookies que Utilizamos</h2>
              <p>
                CiberEduca utiliza únicamente <strong className="text-zinc-100">cookies técnicas estrictamente necesarias</strong> para 
                el funcionamiento de la plataforma. NO utilizamos cookies de publicidad, marketing ni de 
                rastreo de terceros.
              </p>

              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    </span>
                    <div>
                      <h3 className="font-semibold text-zinc-200">access_token</h3>
                      <p className="text-zinc-400 mt-1">
                        <strong>Propósito:</strong> Mantener tu sesión iniciada de forma segura.
                      </p>
                      <p className="text-zinc-400 mt-1">
                        <strong>Duración:</strong> 15 minutos (se renueva automáticamente mientras uses la plataforma).
                      </p>
                      <p className="text-zinc-400 mt-1">
                        <strong>Tipo:</strong> Cookie httpOnly (no accesible por JavaScript para mayor seguridad).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    </span>
                    <div>
                      <h3 className="font-semibold text-zinc-200">refresh_token</h3>
                      <p className="text-zinc-400 mt-1">
                        <strong>Propósito:</strong> Renovar tu sesión sin necesidad de volver a iniciar sesión.
                      </p>
                      <p className="text-zinc-400 mt-1">
                        <strong>Duración:</strong> 7 días.
                      </p>
                      <p className="text-zinc-400 mt-1">
                        <strong>Tipo:</strong> Cookie httpOnly (no accesible por JavaScript para mayor seguridad).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">3. Almacenamiento Local (localStorage)</h2>
              <p>
                Además de cookies, utilizamos el almacenamiento local del navegador para guardar 
                preferencias de interfaz:
              </p>

              <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                  </span>
                  <div>
                    <h3 className="font-semibold text-zinc-200">ce.sidebarCollapsed</h3>
                    <p className="text-zinc-400 mt-1">
                      <strong>Propósito:</strong> Recordar si prefieres la barra lateral expandida o colapsada.
                    </p>
                    <p className="text-zinc-400 mt-1">
                      <strong>Duración:</strong> Permanente hasta que lo cambies o limpies los datos del navegador.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">4. Cookies de Terceros</h2>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-green-200">
                  <strong>CiberEduca NO utiliza cookies de terceros.</strong>
                </p>
                <p className="text-green-100/80 mt-2">
                  No tenemos cookies de publicidad, analytics de terceros, redes sociales ni ningún 
                  tipo de rastreador externo. Tu privacidad es nuestra prioridad.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">5. ¿Por qué son Necesarias?</h2>
              <p>
                Las cookies que utilizamos son <strong className="text-zinc-100">estrictamente necesarias</strong> para:
              </p>
              <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                <li>Mantener tu sesión activa mientras navegas por la plataforma</li>
                <li>Proteger tu cuenta mediante autenticación segura</li>
                <li>Recordar tus preferencias de interfaz</li>
              </ul>
              <p className="mt-2">
                Sin estas cookies, no podrías iniciar sesión ni usar la plataforma de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">6. Gestión de Cookies</h2>
              <p>
                Puedes configurar tu navegador para rechazar cookies, pero ten en cuenta que si 
                deshabilitas las cookies de sesión, no podrás utilizar CiberEduca.
              </p>
              
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <h3 className="font-semibold text-amber-200">Cómo gestionar cookies en tu navegador:</h3>
                <ul className="list-disc list-inside mt-2 text-amber-100/80 space-y-1">
                  <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                  <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                  <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                  <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">7. Seguridad de las Cookies</h2>
              <p>Nuestras cookies de autenticación implementan las siguientes medidas de seguridad:</p>
              <ul className="list-disc list-inside mt-2 text-zinc-400 space-y-1">
                <li><strong>httpOnly:</strong> No pueden ser leídas por código JavaScript, protegiéndolas de ataques XSS</li>
                <li><strong>Secure:</strong> Solo se envían a través de conexiones HTTPS cifradas</li>
                <li><strong>SameSite:</strong> Protección contra ataques CSRF</li>
                <li><strong>Expiración corta:</strong> Los tokens de acceso expiran en 15 minutos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">8. Base Legal</h2>
              <p>
                El uso de cookies técnicas estrictamente necesarias no requiere consentimiento previo 
                según la normativa aplicable, ya que son indispensables para proporcionar el servicio 
                que has solicitado expresamente.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">9. Cambios en esta Política</h2>
              <p>
                Podemos actualizar esta Política de Cookies para reflejar cambios en nuestras prácticas 
                o por motivos legales. Te notificaremos cualquier cambio significativo a través de la 
                plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-3">10. Contacto</h2>
              <p>
                Si tienes preguntas sobre nuestra Política de Cookies, contacta a la administración 
                de tu institución educativa.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link href="/terminos" className="ce-btn ce-btn-ghost">
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className="ce-btn ce-btn-ghost">
            Política de Privacidad
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
