// src/app/terminos/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Términos y Condiciones | Mission Vende',
  description: 'Marco legal, fideicomiso transaccional y protección de datos (Ley 25.326).',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header Legal */}
        <div className="bg-[#1a237e] px-8 py-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Términos y Condiciones</h1>
            <p className="text-blue-200 mt-2 font-medium">Versión 1.0 — Misiones, Argentina</p>
          </div>
          <Link href="/" className="px-6 py-2.5 bg-white text-[#1a237e] font-bold rounded-full hover:bg-blue-50 transition-colors shadow-sm text-sm">
            Volver al inicio
          </Link>
        </div>

        {/* Contenido Contractual */}
        <div className="p-8 sm:p-12 text-gray-700 space-y-10">
            
          {/* Cláusula 1: Edad */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-[#1a237e] w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Capacidad Contratante
            </h2>
            <p className="leading-relaxed">
              El uso de los servicios transaccionales de MossTall (operando comercialmente como Mission Vende) está estrictamente limitado a personas mayores de 18 años con capacidad legal para contratar, conforme a lo establecido en el Código Civil y Comercial de la Nación Argentina. Al registrarse, el usuario declara bajo juramento cumplir con este requisito.
            </p>
          </section>

          {/* Cláusula 2: Ley 25.326 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-[#1a237e] w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Privacidad y Telemetría (Ley 25.326)
            </h2>
            <p className="leading-relaxed mb-4">
              En cumplimiento de la Ley de Protección de Datos Personales N° 25.326, informamos que los datos recabados durante el registro y navegación serán utilizados con fines de auditoría de seguridad, prevención de fraude y mejoras estadísticas del servicio.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Autorizas el registro y almacenamiento de tu <b>dirección IP pública</b> y geodatos vinculados a la creación de tu cuenta y operaciones comerciales.</li>
              <li>Consientes el análisis anonimizado de tus intenciones de compra y métricas de comportamiento (Telemetría Pasiva) para optimizar la experiencia en el Mercado Inverso.</li>
              <li>Tus datos personales no serán vendidos a terceros. MossTall garantiza el derecho de acceso, rectificación y supresión de los mismos.</li>
            </ul>
          </section>

          {/* Cláusula 3: Escrow */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-[#1a237e] w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Fideicomiso Transaccional (Escrow)
            </h2>
            <p className="leading-relaxed">
              Al operar como comprador o vendedor mediante la pasarela de pagos integrada de Mission Vende, aceptas el esquema de Fideicomiso. <b>Los fondos de la compra serán retenidos por la plataforma</b> y no serán liberados a la cuenta bancaria (CBU/CVU) del vendedor hasta que el comprador confirme la recepción conforme del producto o servicio. En caso de disputas, MossTall actuará como mediador vinculante según el estado de la transacción.
            </p>
          </section>

          {/* Cláusula 4: Anti-fraude */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-[#1a237e] w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
              Política Anti-Multicuenta y KYC
            </h2>
            <p className="leading-relaxed">
              Está estrictamente prohibida la creación de múltiples cuentas por un mismo usuario para eludir bloqueos, manipular el sistema de reputación o cometer fraude. Los usuarios que deseen operar como vendedores (Tiendas) deberán someterse a un proceso obligatorio de verificación de identidad (KYC), el cual incluye la validación de DNI y pruebas biométricas. MossTall se reserva el derecho de suspender o cancelar permanentemente cualquier cuenta que presente actividad sospechosa o incumpla estas normativas.
            </p>
          </section>

          <hr className="border-gray-200" />

          <p className="text-sm text-gray-500 text-center font-medium">
            Desarrollado y operado por <b>Moscatelli Technologies</b>. <br />
            Para consultas legales: legales@mosstall.com
          </p>
        </div>
      </div>
    </div>
  );
}