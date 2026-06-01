import { useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { branchesApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { usePagination } from '../../hooks/usePagination';
import { usePagedList } from '../../hooks/usePagedList';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DataTable from '../../components/tables/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';

const emptyForm = { name: '', code: '', address: '', phone: '', timeZone: 'UTC', isActive: true };

export default function BranchesPage() {
  const { toast, promise } = useToast();
  const { params, search, setSearchAndReset, pageNumber, setPageNumber } = usePagination();
  const { data, loading, refreshing, error, reload } = usePagedList(branchesApi.list, {
    params,
    onError: (msg) => toast(msg, 'error'),
  });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setModal('create');
  };

  const openEdit = (row) => {
    setForm({
      name: row.name,
      code: row.code,
      address: row.address || '',
      phone: row.phone || '',
      timeZone: row.timeZone || 'UTC',
      isActive: row.isActive,
    });
    setModal(row.id);
  };

  const save = async () => {
    setSaving(true);
    try {
      await promise(
        async () => {
          if (modal === 'create') await branchesApi.create(form);
          else await branchesApi.update(modal, form);
        },
        {
          loading: 'Saving branch...',
          success: modal === 'create' ? 'Branch created' : 'Branch updated',
        }
      );
      setModal(null);
      reload();
    } catch {
      /* toast handled */
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await promise(() => branchesApi.remove(deleteId), {
        loading: 'Deleting...',
        success: 'Branch deleted',
      });
      setDeleteId(null);
      reload();
    } catch {
      /* toast handled */
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code' },
    { key: 'address', label: 'Address', render: (r) => r.address || '—' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
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
          <Button variant="ghost" className="!p-2" onClick={() => openEdit(r)} aria-label="Edit">
            <FiEdit2 />
          </Button>
          <Button variant="ghost" className="!p-2 text-red-500" onClick={() => setDeleteId(r.id)} aria-label="Delete">
            <FiTrash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle="Manage locations and branch settings"
        action={
          <Button onClick={openCreate}>
            <FiPlus /> Add branch
          </Button>
        }
      />

      <SearchInput
        className="max-w-md"
        value={search}
        onChange={setSearchAndReset}
        placeholder="Search branches..."
      />

      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRetry={reload}
        emptyTitle="No branches found"
        emptyDescription="Create your first branch or adjust your search."
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

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create branch' : 'Edit branch'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Timezone" value={form.timeZone} onChange={(e) => setForm({ ...form, timeZone: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
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
        onConfirm={remove}
        title="Delete branch"
        message="Are you sure you want to delete this branch? This action cannot be undone."
        loading={saving}
      />
    </div>
  );
}
