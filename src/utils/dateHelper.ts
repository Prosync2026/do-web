export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';

    const d = new Date(date);
    if (isNaN(d.getTime()) || d.getFullYear() === 1970) return 'N/A';

    return d.toLocaleDateString('en-GB'); // format: DD/MM/YYYY
}

export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';

    const d = new Date(date);
    if (isNaN(d.getTime()) || d.getFullYear() === 1970) return 'N/A';

    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }); // format: DD/MM/YYYY, hh:mm AM/PM
}

export function formatDateToAPI(date: string | Date | null | undefined): string {
    if (!date) return '';

    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    // Return YYYY-MM-DD without timezone shift
    return `${year}-${month}-${day}`;
}

export function parseDDMMYYYY(dateStr: string | Date | null): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1; // JS month is 0-indexed
    const year = Number(parts[2]);

    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
}
