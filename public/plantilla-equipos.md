# Plantilla de Importación de Equipos

## Formato de Columnas

| # | Columna | Tipo | Ejemplo | Requerido |
|---|---------|------|---------|-----------|
| 1 | Nombre | Texto | Switch Cisco 2960 | ✅ |
| 2 | Tipo | Texto | switch, router, server, firewall, etc. | ❌ |
| 3 | Fabricante | Texto | Cisco | ❌ |
| 4 | Serial | Texto | FCW2222A1A1 | ❌ |
| 5 | IP | Texto | 192.168.1.10 | ❌ |
| 6 | MAC | Texto | 00:1A:2B:3C:4D:5E | ❌ |
| 7 | Fecha Compra | Fecha (YYYY-MM-DD) | 2024-01-15 | ❌ |
| 8 | Garantía | Fecha (YYYY-MM-DD) | 2025-01-15 | ❌ |
| 9 | Estado | Texto | activo, inactivo, mantenimiento | ❌ |
| 10 | Responsable | Texto | Juan Pérez | ❌ |
| 11 | Costo USD | Número | 1500.50 | ❌ |
| 12 | Comentarios | Texto | En funcionamiento, sin problemas | ❌ |

## Ejemplo de Datos

```
Nombre,Tipo,Fabricante,Serial,IP,MAC,Fecha Compra,Garantía,Estado,Responsable,Costo USD,Comentarios
Switch Cisco 2960,switch,Cisco,FCW2222A1A1,192.168.1.10,00:1A:2B:3C:4D:5E,2024-01-15,2025-01-15,activo,Juan Pérez,1500.50,En funcionamiento
Router Mikrotik,router,Mikrotik,RB3011,192.168.1.1,00:0C:42:12:34:56,2023-06-20,2024-06-20,activo,Maria López,800.00,
Firewall Fortinet,firewall,Fortinet,FG201F,192.168.1.100,00:09:0F:A2:00:B1,2024-03-10,2025-03-10,activo,Carlos García,3500.00,
Servidor Dell,server,Dell,6T2NRF2,192.168.1.50,00:14:22:01:23:45,2024-01-01,2026-01-01,activo,Admin,2500.00,
Laptop HP,laptop,HP,CNK5HW2J4V,192.168.1.120,D0:7E:35:4E:A9:D2,2023-09-15,2024-09-15,activo,Pedro Ruiz,1200.00,
```

## Instrucciones

1. Copia los datos a un archivo Excel (.xlsx)
2. Asegúrate de que la **primera fila sea el encabezado**
3. Cada equipo debe tener al menos un **nombre**
4. Haz clic en "Importar Excel" en la página de Equipos
5. Selecciona tu archivo
6. Revisa los resultados y los errores (si los hay)

## Notas

- **Nombre es obligatorio**, otros campos son opcionales
- Las fechas deben estar en formato **YYYY-MM-DD**
- Los costos deben ser números (sin símbolos)
- Los equipos se asignarán al cliente predeterminado
- Si hay errores, se mostrará un resumen al final
