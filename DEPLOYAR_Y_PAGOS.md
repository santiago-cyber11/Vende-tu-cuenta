# VENDE TU CUENTA — publicar, iniciar sesión y preparar pagos seguros

## Estado real del paquete

- La web estática está preparada para publicarse en un hosting HTTPS.
- El inicio de sesión Google y los perfiles están preparados para Firebase, pero NO funcionarán hasta que completes la configuración de tu propio proyecto y reemplaces los valores `REEMPLAZA_...` de `firebase-app.js`.
- El checkout actual es una DEMOSTRACIÓN. No cobra dinero, no confirma pagos y no protege ni retiene fondos.
- No compartas ni pegues en el HTML secretos privados de Firebase Admin, claves privadas de Wompi o el secreto de integridad.
- Las tarjetas de cuentas de ejemplo y los datos del navegador no equivalen a un marketplace con base de datos compartida. Revisa y prueba todos los flujos antes de anunciar la web públicamente.

## A. Publicar una vista previa en Vercel

1. Descarga y descomprime el ZIP.
2. Crea una cuenta en GitHub y un repositorio nuevo, por ejemplo `vende-tu-cuenta`.
3. Sube al repositorio TODO el contenido de la carpeta `vende_tu_cuenta` (index.html, firebase-app.js, firestore.rules, vercel.json y documentos). No subas claves privadas ni archivos de cuentas de servicio.
4. Entra en https://vercel.com/ y elige **Add New → Project**.
5. Importa el repositorio de GitHub. Para esta web estática no necesitas comando de build; usa la carpeta raíz como salida si Vercel solicita una configuración.
6. Pulsa **Deploy**. Vercel te dará una URL `*.vercel.app` con HTTPS.
7. Primero publica una vista previa y pruébala en móvil y computador. La publicación solo pone el sitio en internet; no activa por sí misma Firebase ni los pagos.

Documentación: https://vercel.com/docs/deployments/overview

## B. Activar inicio de sesión con Google y perfiles

1. Entra en https://console.firebase.google.com/ y crea un proyecto.
2. En el proyecto, registra una aplicación web y copia su configuración de Firebase.
3. Abre `firebase-app.js` y reemplaza estos cuatro valores de ejemplo por los de TU proyecto: `apiKey`, `authDomain`, `projectId` y `appId`. La configuración web de Firebase no es una contraseña de servidor; aun así, protege los datos mediante reglas correctas.
4. En Firebase Authentication → Sign-in method, activa **Google** y guarda.
5. En Authentication → Settings → Authorized domains, añade el dominio real de Vercel que te asignaron. Si luego compras un dominio propio, añádelo también.
6. Crea Firestore Database.
7. En Firestore → Rules, publica el contenido de `firestore.rules`. Revisa estas reglas antes de producción y prueba los permisos con usuarios distintos.
8. Vuelve a desplegar la web después de cambiar `firebase-app.js`.
9. Prueba con dos cuentas de Google distintas: iniciar/cerrar sesión, guardar alias, intentar editar perfiles ajenos y comprobar que las reglas lo impiden.

Guía oficial de Google sign-in: https://firebase.google.com/docs/auth/web/google-signin

## C. Pagos seguros en Colombia (Wompi como opción a evaluar)

**No actives cobros reales hasta que Wompi confirme que acepta tu modelo de negocio.** Vender o transferir cuentas de videojuegos puede estar limitado por las reglas del juego o las condiciones de la pasarela. Revisa las condiciones vigentes de Blood Strike y consigue autorización del proveedor de pagos antes de operar.

1. Regístrate en el portal de comercios de Wompi: https://comercios.wompi.co/ y confirma con su equipo que tu tipo de marketplace y el producto digital están permitidos.
2. Integra primero el entorno de pruebas (**Sandbox**) y usa sus llaves de prueba.
3. Necesitas un backend (por ejemplo, una Vercel Function o Cloud Function). El navegador NO debe decidir el precio final, crear compras completadas, guardar ventas como pagadas ni generar la firma con secretos.
4. Cuando el comprador pulsa Comprar, el backend debe verificar su sesión de Firebase, recuperar el anuncio y su precio desde Firestore, crear una referencia única y guardar una orden con estado `pending`.
5. El backend genera la firma SHA-256 de integridad con la referencia, el monto en centavos, la moneda `COP` y el secreto de integridad de Wompi. El secreto se guarda como variable de entorno privada del servidor, nunca en `index.html` ni en `firebase-app.js`.
6. El comprador paga en el checkout alojado por Wompi. No guardes datos de tarjetas en tu web.
7. Configura en Wompi la URL de eventos/webhook de tu backend. El servidor debe verificar la autenticidad del evento según la documentación oficial, comprobar la transacción con la API de Wompi y validar referencia, monto, moneda y estado antes de cambiar la orden a pagada.
8. Haz idempotente el webhook: una notificación repetida no debe crear una segunda venta ni liberar dos veces el mismo artículo.
9. Solo tras una confirmación auténtica del servidor, actualiza el pedido y el historial de venta. Nunca uses solo la URL de retorno del navegador como prueba de pago.
10. Prueba pagos aprobados, rechazados, abandonados, notificaciones repetidas, montos manipulados y usuarios intentando comprar su propio anuncio.
11. Cuando todo pase las pruebas y el proveedor te autorice, cambia a las llaves de producción en variables de entorno y revisa los registros y procedimientos de reembolso.

Documentación oficial Wompi:
- Checkout web y firma de integridad: https://docs.wompi.co/docs/colombia/widget-checkout-web/
- Eventos/webhooks: https://docs.wompi.co/docs/colombia/eventos/

## D. Si quieres actuar como intermediario

Una pasarela de pago no significa que tengas custodia o depósito en garantía. Si pretendes retener dinero hasta que el comprador reciba la cuenta, necesitas un flujo de pagos y desembolsos autorizado por el proveedor, reglas de disputas, reembolsos, prevención de fraude y asesoría legal/contable. No prometas “pago protegido” o “escrow” hasta que ese servicio esté implementado y autorizado.

## E. Lista antes de lanzar

- [ ] Configuración Firebase real añadida.
- [ ] Google Auth activado y dominio autorizado.
- [ ] Reglas Firestore probadas con usuarios diferentes.
- [ ] Publicaciones, imágenes y propiedad del anuncio conectadas a la base de datos real.
- [ ] Backend y webhook de pagos implementados y probados en Sandbox.
- [ ] Wompi confirma que el negocio está permitido.
- [ ] Aviso de privacidad, términos, política de reembolsos y canal de soporte publicados.
- [ ] Pagos reales activados solo después de superar las pruebas.
