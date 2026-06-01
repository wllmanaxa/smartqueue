import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { branchesApi, countersApi, servicesApi, usersApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { usePagination } from '../../hooks/usePagination';
import { usePagedList } from '../../hooks/usePagedList';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/tables/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';

export default function CountersPage() {
  const { toast, promise } = useToast();
  const { params, pageNumber, setPageNumber, reset } = usePagination();
  const [branchFilter, setBranchFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const listParams = useMemo(
    () => ({ ...params, branchId: branchFilter || undefined }),
    [params, branchFilter]
  );

  const { data, loading, refreshing, error, reload } = usePagedList(countersApi.list, {
    params: listParams,
    onError: (msg) => toast(msg, 'error'),
  });

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    number: '',
    branchId: '',
    staffUserId: '',
    isActive: true,
    serviceIds: [],
  });
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    branchesApi.list({ pageNumber: 1, pageSize: 100 }).then((r) => setBranches(r.items ?? [])).catch(() => {});
    usersApi.list({ pageNumber: 1, pageSize: 100 }).then((r) => setStaff(r.items ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.branchId) {
      servicesApi
        .list({ branchId: form.branchId, pageNumber: 1, pageSize: 100 })
        .then((r) => setServices(r.items ?? []))
        .catch(() => setServices([]));
    } else {
      setServices([]);
    }
  }, [form.branchId]);

  const toggleService = (id) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        number: form.number,
        branchId: form.branchId,
        staffUserId: form.staffUserId || null,
        isActive: form.isActive,
        serviceIds: form.serviceIds,
      };
      await promise(
        async () => {
          if (modal === 'create') await countersApi.create(payload);
          else await countersApi.update(modal, payload);
        },
        { loading: 'Saving...', success: modal === 'create' ? 'Counter created' : 'Counter updated' }
      );
      setModal(null);
      reload();
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'number', label: 'Number' },
    { key: 'branchName', label: 'Branch' },
    { key: 'staffUserName', label: 'Staff', render: (r) => r.staffUserName || '—' },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => (
        <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Open' : 'Closed'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            className="!p-2"
            onClick={() => {
              setForm({
                name: r.name,
                number: r.number,
                branchId: r.branchId,
                staffUserId: r.staffUserId || '',
                isActive: r.isActive,
                serviceIds: r.serviceIds || [],
              });
              setModal(r.id);
            }}
          >
            <FiEdit2 />
          </Button>
          <Button variant="ghost" className="!p-2 text-red-500" onClick={() => setDeleteId(r.id)}>
            <FiTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Counters"
        subtitle="Manage desks, staff assignment, and open/close status"
        action={
          <Button
            onClick={() => {
              setForm({
                name: '',
                number: '',
                branchId: branches[0]?.id || '',
                staffUserId: '',
                isActive: true,
                serviceIds: [],
              });
              setModal('create');
            }}
          >
            <FiPlus /> Add counter
          </Button>
        }
      />

      <Select
        className="max-w-xs"
        options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
        value={branchFilter}
        onChange={(e) => {
          setBranchFilter(e.target.value);
          reset();
        }}
      />

      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRetry={reload}
        emptyTitle="No counters"
        emptyDescription="Add a counter for your branch."
      />

      {!loading && data.totalCount > 0 && (
        <Pagination
          pageNumber={pageNumber}
          totalPages={data.totalPages}
          totalCount={data.totalCount}
          onPrevious={() => setPageNumber((p) => Math.max(1, p - 1))}
          onNext={() => setPageNumber((p) => Math.min(data.totalPages, p + 1))}
        />
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create counter' : 'Edit counter'} size="lg">
        <div className="space-y-4">
          <Select
            label="Branch"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value, serviceIds: [] })}
          />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
          <Select
            label="Assign staff"
            options={[{ value: '', label: 'Unassigned' }, ...staff.map((u) => ({ value: u.id, label: u.userName }))]}
            value={form.staffUserId}
            onChange={(e) => setForm({ ...form, staffUserId: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Counter open (active)
          </label>
          <div>
            <p className="mb-2 text-sm font-medium">Services</p>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    form.serviceIds.includes(s.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" loading={saving} onClick={save}>
            Save
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          try {
            await promise(() => countersApi.remove(deleteId), {
              loading: 'Deleting...',
              success: 'Counter deleted',
            });
            setDeleteId(null);
            reload();
          } catch {
            /* handled */
          }
        }}
        title="Delete counter"
        message="Remove this counter permanently?"
      />
    </div>
  );
}
