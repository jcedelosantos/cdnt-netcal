# Plantilla de Importación de Equipos

## Formato de Columnas (Flexible)

El sistema detecta automáticamente las columnas. Puedes usar cualquiera de estos nombres:

| Columna | Alias Aceptados | Tipo | Ejemplo | Requerido |
|---------|-----------------|------|---------|-----------|
| Nombre | - | Texto | Switch Cisco 2960 | ✅ |
| Serie / Serial / SN | serie, serial, sn | Texto | FCW2222A1A1 | ❌ |
| Dirección IP / IP | dirección ip, ip | Texto | 192.168.1.10 | ❌ |
| Dirección MAC / MAC | dirección mac, mac | Texto | 00:1A:2B:3C:4D:5E | ❌ |
| Fabricante | fabricante | Texto | Cisco | ❌ |
| Tipo | tipo, tipo equipo | Texto | switch, router, etc. | ❌ |
| Comentarios | comentarios | Texto | En funcionamiento | ❌ |
| Fecha Compra | fecha compra | Fecha (YYYY-MM-DD) | 2024-01-15 | ❌ |
| Garantía | garantía | Fecha (YYYY-MM-DD) | 2025-01-15 | ❌ |
| Costo | costo | Número | 1500.50 | ❌ |

## Ejemplo Mínimo (como tu Excel actual)

```
Nombre,Dirección IP,Fabricante,Dirección MAC,Serie,Comentarios
Switch HUAWEI,10.0.0.2,HUAWEI TECHNOLOGIES,A4:99:47:51:94:D6,SW-HW-001,
Router Murata,10.0.0.3,Murata Manufacturing Co.,F0:27:65:F5:FF:1F,RT-MUR-002,
```

## Ejemplo Completo (todas las columnas)

```
Nombre,Tipo,Fabricante,Serie,Dirección IP,Dirección MAC,Fecha Compra,Garantía,Estado,Responsable,Costo,Comentarios
Switch Cisco 2960,switch,Cisco,FCW2222A1A1,192.168.1.10,00:1A:2B:3C:4D:5E,2024-01-15,2025-01-15,activo,Juan Pérez,1500.50,En funcionamiento
Router Mikrotik,router,Mikrotik,RB3011,192.168.1.1,00:0C:42:12:34:56,2023-06-20,2024-06-20,activo,Maria López,800.00,
Firewall Fortinet,firewall,Fortinet,FG201F,192.168.1.100,00:09:0F:A2:00:B1,2024-03-10,2025-03-10,activo,Carlos García,3500.00,
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
