import { Link } from 'react-router-dom';
import canvas from './canvas.json';
import { BOARD_ROUTES } from './routes';

interface Board { page: string; title: string; w: number }
const boards = canvas.boards as unknown as Record<string, Board>;
const pages = canvas.pages as { id: string; name: string }[];

/** Daftar semua board dari canvas.json beserta rute React padanannya (dev only). */
export function BoardIndex() {
  const done = Object.keys(boards).filter((k) => BOARD_ROUTES[k]).length;
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontSize: 13 }}>
      <h1 className="page-title">Indeks board</h1>
      <p>
        {done} dari {Object.keys(boards).length} board sudah punya rute. <Link to="/insiden">Kembali ke aplikasi</Link> · <Link to="/dev/email">Email</Link>
      </p>
      {pages.map((p) => {
        const items = Object.entries(boards).filter(([, b]) => b.page === p.id);
        if (!items.length) return null;
        return (
          <section key={p.id} className="p-card" style={{ margin: '16px 0' }}>
            <h2 className="p-h2">{p.name} ({items.length})</h2>
            <table className="p-table" style={{ width: '100%' }}>
              <tbody>
                {items.map(([name, b]) => (
                  <tr key={name}>
                    <td className="data-id">{name.replace('.dc.html', '')}</td>
                    <td>{b.title}</td>
                    <td>{b.w}px</td>
                    <td>{BOARD_ROUTES[name] ? <Link to={BOARD_ROUTES[name]}>{BOARD_ROUTES[name]}</Link> : <span className="sub">belum dibangun</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
