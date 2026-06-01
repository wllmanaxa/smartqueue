import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { branchesApi, servicesApi } from '../../api/services';
import { getApiError } from '../../api/helpers';
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
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const emptyForm = {
  name: '',
  code: '',
  description: '',
  averageHandlingMinutes: 10,
  branchId: '',
  isActive: true,
};

export default function ServicesPage() {
  const { toast, promise } = useToast();
  const { params, search, setSearchAndReset, pageNumber, setPageNumber, reset } = usePagination();
  const [branchFilter, setBranchFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const listParams = useMemo(
    () => ({ ...params, branchId: branchFilter || undefined }),
    [params, branchFilter]
  );

  const { data, loading, refreshing, error, reload } = usePagedList(servicesApi.list, {
    params: listParams,
    onError: (msg) => toast(msg, 'error'),
  });

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBranchesLoading(true);
    branchesApi
      .list({ pageNumber: 1, pageSize: 100 })
      .then((r) => {
        if (!cancelled) setBranches(r.items ?? []);
      })
      .catch((e) => {
        if (!cancelled) toast(getApiError(e), 'error');
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const openCreate = () => {
    setForm({ ...emptyForm, branchId: branches[0]?.id || '' });
    setModal('create');
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      code: row.code,
      description: row.description || '',
      averageHandlingMinutes: row.averageHandlingMinutes,
      branchId: row.branchId,
      isActive: row.isActive,
    });
    setModal(row.id);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description,
        averageHandlingMinutes: Number(form.averageHandlingMinutes),
        branchId: form.branchId,
        isActive: form.isActive,
      };
      await promise(
        async () => {
          if (modal === 'create') await servicesApi.create(payload);
          else await servicesApi.update(modal, payload);
        },
        {
          loading: 'Saving service...',
          success: modal === 'create' ? 'Service created' : 'Service updated',
        }
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
    { key: 'code', label: 'Code / Prefix' },
    { key: 'branchName', label: 'Branch' },
    { key: 'averageHandlingMinutes', label: 'Avg (min)', render: (r) => r.averageHandlingMinutes ?? '—' },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => (
        <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" className="!p-2" onClick={() => openEdit(r)}>
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
        title="Services"
        subtitle="Queue services per branch"
        action={
          <Button onClick={openCreate} disabled={branchesLoading || !branches.length}>
            <FiPlus /> Add service
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <SearchInput
          className="min-w-[200px] flex-1 max-w-md"
          value={search}
          onChange={setSearchAndReset}
          placeholder="Search services..."
        />
        {branchesLoading ? (
          <div className="flex h-11 w-52 items-center justify-center">
            <Spinner className="h-5 w-5" />
          </div>
        ) : (
          <Select
            options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              reset();
            }}
            className="w-52"
          />
        )}
      </div>

      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRetry={reload}
        emptyTitle="No services found"
        emptyDescription="Add a service or change your filters."
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

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create service' : 'Edit service'}>
        <div className="space-y-4">
          <Select
            label="Branch"
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            disabled={modal !== 'create'}
          />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Code (prefix)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input
            label="Average service time (minutes)"
            type="number"
            min={1}
            value={form.averageHandlingMinutes}
            onChange={(e) => setForm({ ...form, averageHandlingMinutes: e.target.value })}
          />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
          <Button className="w-full" loading={saving} onClick={save}>
            Save
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          setSaving(true);
          try {
            await promise(() => servicesApi.remove(deleteId), {
              loading: 'Deleting...',
              success: 'Service deleted',
            });
            setDeleteId(null);
            reload();
          } catch {
            /* handled */
          } finally {
            setSaving(false);
          }
        }}
        title="Delete service"
        message="Delete this service permanently?"
        loading={saving}
      />
    </div>
  );
}
