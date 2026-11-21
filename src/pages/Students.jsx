import { useMemo, useState } from 'react';
import { coursesApi, studentsApi } from '../api/index.js';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../components/Toast.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icon.jsx';
import StudentForm from '../components/StudentForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Empty, ErrorState, Loading } from '../components/States.jsx';

export default function Students() {
  const toast = useToast();
  const students = useResource(studentsApi.list);
  const courses = useResource(coursesApi.list);
  const [q, setQ] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [form, setForm] = useState(null); // { mode: 'add' | 'edit', student? }
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const courseList = courses.data || [];
  const courseName = useMemo(() => new Map(courseList.map((c) => [c.cid, c.cname])), [courseList]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (students.data || [])
      .filter((s) => courseFilter === 'all' || String(s.crsId) === courseFilter)
      .filter((s) => !term || `${s.sname} ${s.smail} ${s.sid}`.toLowerCase().includes(term))
      .sort((a, b) => a.sid - b.sid);
  }, [students.data, q, courseFilter]);

  const reload = () => { students.reload(); courses.reload(); };

  const save = async (values) => {
    setBusy(true);
    try {
      if (form.mode === 'add') {
        await studentsApi.add(values);
        toast.success('Student added');
      } else {
        await studentsApi.update(form.student.sid, values);
        toast.success('Student updated');
      }
      setForm(null);
      students.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await studentsApi.remove(toDelete.sid);
      toast.success(`Deleted ${toDelete.sname}`);
      setToDelete(null);
      students.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const error = students.error || courses.error;
  const loading = !students.data && !courses.data && (students.loading || courses.loading);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Student service</p>
          <h1>Students</h1>
        </div>
        <button className="btn primary" onClick={() => setForm({ mode: 'add' })}><Icon name="plus" size={16} /> Add student</button>
      </header>

      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? <Loading /> : (
        <div className="panel">
          <div className="toolbar">
            <label className="search">
              <Icon name="search" size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or ID" aria-label="Search students" />
            </label>
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Filter by course">
              <option value="all">All courses</option>
              {courseList.map((c) => <option key={c.cid} value={c.cid}>{c.cname}</option>)}
            </select>
            <span className="muted count">{rows.length} of {(students.data || []).length}</span>
          </div>

          {rows.length === 0 ? (
            <Empty
              title={(students.data || []).length === 0 ? 'No students yet' : 'No students match your search'}
              hint={(students.data || []).length === 0 ? 'Add the first student to get started.' : 'Try a different search or course filter.'}
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Student</th><th>Course</th><th className="right">Actions</th></tr></thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.sid}>
                      <td className="muted">#{s.sid}</td>
                      <td>
                        <div className="person">
                          <Avatar name={s.sname} />
                          <div><strong>{s.sname}</strong><span className="muted">{s.smail}</span></div>
                        </div>
                      </td>
                      <td>
                        {courseName.has(s.crsId)
                          ? <a className="chip link" href={`#/courses/${s.crsId}`}>{courseName.get(s.crsId)}</a>
                          : <span className="chip">Course #{s.crsId}</span>}
                      </td>
                      <td className="right">
                        <button className="icon-btn" onClick={() => setForm({ mode: 'edit', student: s })} aria-label={`Edit ${s.sname}`}><Icon name="edit" /></button>
                        <button className="icon-btn danger" onClick={() => setToDelete(s)} aria-label={`Delete ${s.sname}`}><Icon name="trash" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {form && (
        <StudentForm mode={form.mode} initial={form.student} courses={courseList} busy={busy} onSubmit={save} onCancel={() => setForm(null)} />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete student?"
          message={`${toDelete.sname} (#${toDelete.sid}) will be permanently removed.`}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
