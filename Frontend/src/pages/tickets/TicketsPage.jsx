import { useEffect, useMemo, useState } from 'react';

import { FiPlus, FiPhone, FiCheck, FiSkipForward, FiX } from 'react-icons/fi';

import { branchesApi, countersApi, servicesApi, ticketsApi } from '../../api/services';

import { useToast } from '../../context/ToastContext';

import { usePagination } from '../../hooks/usePagination';

import { usePagedList } from '../../hooks/usePagedList';

import Button from '../../components/ui/Button';

import Modal from '../../components/ui/Modal';

import Select from '../../components/ui/Select';

import DataTable from '../../components/tables/DataTable';

import PageHeader from '../../components/ui/PageHeader';

import Pagination from '../../components/ui/Pagination';

import Badge from '../../components/ui/Badge';



const statusVariant = {

  Waiting: 'warning',

  Serving: 'cyan',

  Completed: 'success',

  Skipped: 'default',

  Cancelled: 'danger',

};



function formatCounterLabel(counter) {

  const name = counter.name?.trim();

  const number = counter.number?.trim();

  if (name && number) return `${name} (#${number})`;

  return name || (number ? `Counter #${number}` : 'Counter');

}



function counterMatchesService(counter, serviceId) {

  if (!serviceId) return true;

  const ids = counter.serviceIds ?? counter.ServiceIds ?? [];

  return ids.some((id) => String(id) === String(serviceId));

}



export default function TicketsPage() {

  const { toast, promise } = useToast();

  const { params, pageNumber, setPageNumber, reset } = usePagination();

  const [branches, setBranches] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');

  const [branchFilter, setBranchFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);

  const [callTicket, setCallTicket] = useState(null);

  const [callCounters, setCallCounters] = useState([]);

  const [callCountersLoading, setCallCountersLoading] = useState(false);

  const [counterId, setCounterId] = useState('');

  const [form, setForm] = useState({ branchId: '', serviceId: '', priority: 'Normal' });

  const [createServices, setCreateServices] = useState([]);

  const [createServicesLoading, setCreateServicesLoading] = useState(false);



  const listParams = useMemo(

    () => ({

      ...params,

      branchId: branchFilter || undefined,

      status: statusFilter || undefined,

    }),

    [params, branchFilter, statusFilter]

  );



  const { data, loading, refreshing, error, reload } = usePagedList(ticketsApi.list, {

    params: listParams,

    onError: (msg) => toast(msg, 'error'),

  });



  const callCounterOptions = useMemo(

    () =>

      callCounters.map((c) => ({

        value: c.id,

        label: formatCounterLabel(c),

      })),

    [callCounters]

  );



  const callCounterEmptyMessage = useMemo(() => {

    if (callCountersLoading) return 'Loading counters...';

    if (!callTicket?.serviceId) return 'Ticket service is missing. Cannot load counters.';

    return 'No open counters are assigned to this service. Configure counter services on the Counters page.';

  }, [callCountersLoading, callTicket?.serviceId]);



  useEffect(() => {

    branchesApi.list({ pageNumber: 1, pageSize: 100 }).then((r) => setBranches(r.items ?? []));

  }, []);



  useEffect(() => {

    if (!createOpen || !form.branchId) {

      setCreateServices([]);

      setCreateServicesLoading(false);

      return;

    }

    let cancelled = false;

    setCreateServicesLoading(true);

    servicesApi

      .list({ branchId: form.branchId, pageNumber: 1, pageSize: 100 })

      .then((r) => {

        if (!cancelled) setCreateServices(r.items ?? []);

      })

      .catch(() => {

        if (!cancelled) setCreateServices([]);

      })

      .finally(() => {

        if (!cancelled) setCreateServicesLoading(false);

      });

    return () => {

      cancelled = true;

    };

  }, [createOpen, form.branchId]);



  useEffect(() => {

    if (!callTicket?.branchId) {

      setCallCounters([]);

      setCallCountersLoading(false);

      setCounterId('');

      return;

    }



    let cancelled = false;

    setCallCountersLoading(true);

    setCounterId('');



    countersApi

      .list({

        branchId: callTicket.branchId,

        serviceId: callTicket.serviceId || undefined,

        activeOnly: true,

        pageNumber: 1,

        pageSize: 100,

      })

      .then((r) => {

        if (cancelled) return;

        const items = (r.items ?? []).filter((c) => counterMatchesService(c, callTicket.serviceId));

        setCallCounters(items);

        setCounterId(items[0]?.id ?? '');

      })

      .catch(() => {

        if (!cancelled) {

          setCallCounters([]);

          setCounterId('');

        }

      })

      .finally(() => {

        if (!cancelled) setCallCountersLoading(false);

      });



    return () => {

      cancelled = true;

    };

  }, [callTicket]);



  const createTicket = async () => {

    try {

      await promise(() => ticketsApi.create(form), {

        loading: 'Creating ticket...',

        success: 'Ticket created',

      });

      setCreateOpen(false);

      reload();

    } catch {

      /* handled */

    }

  };



  const ticketAction = async (fn, successMsg) => {

    try {

      await promise(fn, { loading: 'Processing...', success: successMsg });

      reload();

    } catch {

      /* handled */

    }

  };



  const columns = [

    {

      key: 'ticketNumber',

      label: 'Ticket #',

      render: (r) => <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{r.ticketNumber}</span>,

    },

    { key: 'serviceName', label: 'Service' },

    { key: 'branchName', label: 'Branch' },

    {

      key: 'status',

      label: 'Status',

      render: (r) => <Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge>,

    },

    { key: 'priority', label: 'Priority', render: (r) => <Badge variant="primary">{r.priority}</Badge> },

    { key: 'wait', label: 'Est. wait', render: (r) => `${r.estimatedWaitMinutes ?? 0} min` },

    {

      key: 'actions',

      label: '',

      render: (r) => (

        <div className="flex flex-wrap justify-end gap-1">

          {r.status === 'Waiting' && (

            <Button

              variant="ghost"

              size="sm"

              className="!px-2"

              onClick={() => setCallTicket(r)}

            >

              <FiPhone /> Call

            </Button>

          )}

          {r.status === 'Serving' && (

            <Button variant="ghost" size="sm" className="!px-2" onClick={() => ticketAction(() => ticketsApi.complete(r.id), 'Completed')}>

              <FiCheck />

            </Button>

          )}

          {(r.status === 'Waiting' || r.status === 'Serving') && (

            <>

              <Button variant="ghost" size="sm" className="!px-2" onClick={() => ticketAction(() => ticketsApi.skip(r.id), 'Skipped')}>

                <FiSkipForward />

              </Button>

              <Button variant="ghost" size="sm" className="!px-2 text-red-500" onClick={() => ticketAction(() => ticketsApi.cancel(r.id), 'Cancelled')}>

                <FiX />

              </Button>

            </>

          )}

        </div>

      ),

    },

  ];



  return (

    <div className="space-y-6">

      <PageHeader

        title="Tickets"

        subtitle="Create, call, complete, skip, and cancel tickets"

        action={

          <Button

            onClick={() => {

              setForm({ branchId: branches[0]?.id || '', serviceId: '', priority: 'Normal' });

              setCreateOpen(true);

            }}

          >

            <FiPlus /> New ticket

          </Button>

        }

      />



      <div className="flex flex-wrap gap-3">

        <Select

          className="w-52"

          options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}

          value={branchFilter}

          onChange={(e) => {

            setBranchFilter(e.target.value);

            reset();

          }}

        />

        <Select

          className="w-44"

          options={[

            { value: '', label: 'All statuses' },

            { value: 'Waiting', label: 'Waiting' },

            { value: 'Serving', label: 'Serving' },

            { value: 'Completed', label: 'Completed' },

            { value: 'Skipped', label: 'Skipped' },

            { value: 'Cancelled', label: 'Cancelled' },

          ]}

          value={statusFilter}

          onChange={(e) => {

            setStatusFilter(e.target.value);

            reset();

          }}

        />

      </div>



      <DataTable

        columns={columns}

        data={data.items}

        loading={loading}

        refreshing={refreshing}

        error={error}

        onRetry={reload}

        emptyTitle="No tickets"

        emptyDescription="Create a ticket or adjust filters."

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



      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create ticket">

        <div className="space-y-4">

          <Select

            label="Branch"

            options={branches.map((b) => ({ value: b.id, label: b.name }))}

            value={form.branchId}

            onChange={(e) => setForm({ ...form, branchId: e.target.value, serviceId: '' })}

          />

          <Select

            label="Service"

            placeholder="Select service"

            options={createServices.map((s) => ({ value: s.id, label: s.name }))}

            value={form.serviceId}

            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}

            disabled={!form.branchId}

            loading={createServicesLoading}

          />

          <Select

            label="Priority"

            options={[

              { value: 'Normal', label: 'Normal' },

              { value: 'VIP', label: 'VIP' },

              { value: 'Emergency', label: 'Emergency' },

            ]}

            value={form.priority}

            onChange={(e) => setForm({ ...form, priority: e.target.value })}

          />

          <Button className="w-full" onClick={createTicket}>

            Create

          </Button>

        </div>

      </Modal>



      <Modal open={!!callTicket} onClose={() => setCallTicket(null)} title="Call ticket to counter">

        {callTicket && (

          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">

            Ticket <span className="font-mono font-semibold text-slate-900 dark:text-white">{callTicket.ticketNumber}</span>

            {' · '}

            {callTicket.serviceName || 'Service'}

            {' · '}

            {callTicket.branchName || 'Branch'}

          </p>

        )}

        <Select

          label="Counter"

          placeholder="Select counter"

          options={callCounterOptions}

          value={counterId}

          onChange={(e) => setCounterId(e.target.value)}

          loading={callCountersLoading}

          disabled={callCountersLoading || callCounterOptions.length === 0}

          emptyMessage={callCounterEmptyMessage}

        />

        <Button

          className="mt-4 w-full"

          disabled={!counterId || callCountersLoading}

          onClick={async () => {

            try {

              await promise(() => ticketsApi.call(callTicket.id, counterId), {

                loading: 'Calling...',

                success: 'Ticket called',

              });

              setCallTicket(null);

              reload();

            } catch {

              /* handled */

            }

          }}

        >

          Call now

        </Button>

      </Modal>

    </div>

  );

}


