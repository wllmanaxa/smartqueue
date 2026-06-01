import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { branchesApi, rolesApi, usersApi } from '../../api/services';
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

const roleVariant = {
  Admin: 'danger',
  Staff: 'primary',
  Receptionist: 'cyan',
  Customer: 'default',
};

export default function UsersPage() {
  const { toast, promise } = useToast();
  const { params, search, setSearchAndReset, pageNumber, setPageNumber } = usePagination();
  const { data, loading, refreshing, error, reload } = usePagedList(usersApi.list, {
    params,
    onError: (msg) => toast(msg, 'error'),
  });
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    roleId: '',
    branchId: '',
    isActive: true,
  });
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    rolesApi.list({ pageNumber: 1, pageSize: 20 }).then((r) => setRoles(r.items ?? []));
    branchesApi.list({ pageNumber: 1, pageSize: 100 }).then((r) => setBranches(r.items ?? []));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await promise(
        async () => {
          if (modal === 'create') {
            await usersApi.create({ ...form, branchId: form.branchId || null });
          } else {
            await usersApi.update(modal, {
              email: form.email,
              fullName: form.fullName,
              phoneNumber: form.phoneNumber,
              roleId: form.roleId,
              branchId: form.branchId || null,
              isActive: form.isActive,
            });
          }
        },
        { loading: 'Saving...', success: modal === 'create' ? 'User created' : 'User updated' }
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
    { key: 'userName', label: 'Username' },
    { key: 'email', label: 'Email' },
    {
      key: 'roleName',
      label: 'Role',
      render: (r) => <Badge variant={roleVariant[r.roleName] || 'default'}>{r.roleName}</Badge>,
    },
    { key: 'branchName', label: 'Branch', render: (r) => r.branchName || '—' },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
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
                userName: r.userName,
                email: r.email,
                password: '',
                fullName: r.fullName || '',
                phoneNumber: r.phoneNumber || '',
                roleId: r.roleId,
                branchId: r.branchId || '',
                isActive: r.isActive,
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
        title="Users"
        subtitle="Admins, staff, and receptionists"
        action={
          <Button
            onClick={() => {
              setForm({
                userName: '',
                email: '',
                password: '',
                fullName: '',
                phoneNumber: '',
                roleId: roles[0]?.id || '',
                branchId: '',
                isActive: true,
              });
              setModal('create');
            }}
          >
            <FiPlus /> Add user
          </Button>
        }
      />

      <SearchInput className="max-w-md" value={search} onChange={setSearchAndReset} placeholder="Search users..." />

      <DataTable
        columns={columns}
        data={data.items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRetry={reload}
        emptyTitle="No users found"
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

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Create user' : 'Edit user'}>
        <div className="space-y-4">
          {modal === 'create' && (
            <Input label="Username" value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
          )}
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {modal === 'create' && (
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Select
            label="Role"
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            value={form.roleId}
            onChange={(e) => setForm({ ...form, roleId: e.target.value })}
          />
          <Select
            label="Branch"
            options={[{ value: '', label: 'None' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          />
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
          try {
            await promise(() => usersApi.remove(deleteId), {
              loading: 'Deleting...',
              success: 'User removed',
            });
            setDeleteId(null);
            reload();
          } catch {
            /* handled */
          }
        }}
        title="Delete user"
        message="Soft-delete this user?"
      />
    </div>
  );
}
