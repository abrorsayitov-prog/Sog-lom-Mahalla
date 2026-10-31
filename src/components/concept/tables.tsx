import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Badge } from "./ui";
import type { DoctorRow, PatientRow } from "./data";

export function DoctorsTable({
  rows,
  onSelect,
}: {
  rows: DoctorRow[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="concept-table-wrap">
      <table className="concept-table">
        <thead>
          <tr>
            <th>Ism Familiya</th>
            <th>Mutaxassislik</th>
            <th>Bemorlar</th>
            <th>Holat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.name}>
              <td>
                <Button variant="ghost" className="person-button" onClick={() => onSelect(d.name)}>
                  <Avatar initials={d.initials} />
                  <span>{d.name}</span>
                </Button>
              </td>
              <td>{d.specialty}</td>
              <td>{d.patients}</td>
              <td>
                <Badge tone={d.tone}>{d.state}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="concept-empty">Shifokor topilmadi</p>}
    </div>
  );
}

export function PatientsTable({
  rows,
  onSelect,
}: {
  rows: PatientRow[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="concept-table-wrap">
      <table className="concept-table">
        <thead>
          <tr>
            <th>Ism Familiya</th>
            <th>Telefon</th>
            <th>Kasallik</th>
            <th>Holat</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name}>
              <td>
                <Button variant="ghost" className="person-button" onClick={() => onSelect(p.name)}>
                  <Avatar initials={p.initials} />
                  <span>{p.name}</span>
                </Button>
              </td>
              <td>{p.phone}</td>
              <td>{p.disease}</td>
              <td>
                <Badge tone={p.tone}>{p.state}</Badge>
              </td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Bemor ma’lumotlari"
                  onClick={() => onSelect(p.name)}
                >
                  <MoreHorizontal />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="concept-empty">Bemor topilmadi</p>}
    </div>
  );
}

export function AdminPatientsTable({
  rows,
  onSelect,
}: {
  rows: PatientRow[];
  onSelect: (name: string) => void;
}) {
  return (
    <div className="concept-table-wrap">
      <table className="concept-table">
        <thead>
          <tr>
            <th>Ism Familiya</th>
            <th>Kasallik</th>
            <th>Kuzatuvchi shifokor</th>
            <th>Holat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name}>
              <td>
                <Button variant="ghost" className="person-button" onClick={() => onSelect(p.name)}>
                  <Avatar initials={p.initials} />
                  <span>{p.name}</span>
                </Button>
              </td>
              <td>{p.disease}</td>
              <td>{p.doctor}</td>
              <td>
                <Badge tone={p.tone}>{p.state}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="concept-empty">Bemor topilmadi</p>}
    </div>
  );
}
