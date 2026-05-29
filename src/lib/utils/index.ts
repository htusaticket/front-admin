export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

export const formatDate = (date: Date | string, locale: string = "es-AR"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Combina una fecha (YYYY-MM-DD) y una hora (HH:MM) interpretándolas en la
 * zona horaria LOCAL del navegador del admin y devuelve el instante en ISO 8601 UTC.
 *
 * El admin puede estar en cualquier país: lo que escribe se entiende como SU hora
 * local y se convierte al instante real (UTC) que se guarda en la base. Después cada
 * pantalla lo muestra en la zona que corresponda (admin en su zona, alumno en la suya).
 *
 * Devuelve null si la fecha/hora no forman un instante válido.
 */
export const localDateTimeToISO = (date: string, time: string): string | null => {
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

/**
 * Etiqueta corta de la zona horaria del navegador (ej. "GMT-3"), para avisarle
 * al admin en qué zona se está interpretando el horario que carga.
 */
export const getLocalZoneLabel = (): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "your local time";
  } catch {
    return "your local time";
  }
};
