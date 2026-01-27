import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../lib/api';
import { getAllHolidays } from '../lib/holidays';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle,
    XCircle,
    PartyPopper,
    CalendarDays,
    Plus
} from 'lucide-react';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Calendar() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [jobs, setJobs] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const holidays = getAllHolidays(year);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs');
            setJobs(response.data);
        } catch (error) {
            console.error('Erro ao buscar jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Gera os dias do mês
    const getDaysInMonth = () => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Dias do mês anterior
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                currentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i)
            });
        }

        // Dias do mês atual
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                currentMonth: true,
                date: new Date(year, month, i)
            });
        }

        // Dias do próximo mês
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                currentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    };

    const getJobsForDate = (date) => {
        return jobs.filter(job => {
            const jobDate = new Date(job.scheduledAt);
            return (
                jobDate.getDate() === date.getDate() &&
                jobDate.getMonth() === date.getMonth() &&
                jobDate.getFullYear() === date.getFullYear()
            );
        });
    };

    const getHolidayForDate = (date) => {
        const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return holidays[monthDay] || null;
    };

    const isToday = (date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setSelectedDate(null);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null);
    };

    const days = getDaysInMonth();
    const selectedDayJobs = selectedDate ? getJobsForDate(selectedDate) : [];
    const selectedDayHoliday = selectedDate ? getHolidayForDate(selectedDate) : null;

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sent':
                return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return <Clock className="w-4 h-4 text-amber-400" />;
        }
    };

    // Navegar para criar agendamento com data pré-selecionada
    const handleCreateSchedule = () => {
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            navigate(`/new-status?date=${formattedDate}`);
        } else {
            navigate('/new-status');
        }
    };

    return (
        <div className="min-h-screen">
            <Header title="Calendário" />

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendário */}
                    <div className="lg:col-span-2 glass rounded-2xl p-6">
                        {/* Header do Calendário */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={prevMonth}
                                    className="p-2 hover:bg-[var(--surface-light)] rounded-xl transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-xl font-bold min-w-[180px] text-center">
                                    {MONTHS[month]} {year}
                                </h2>
                                <button
                                    onClick={nextMonth}
                                    className="p-2 hover:bg-[var(--surface-light)] rounded-xl transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={goToToday}
                                className="px-4 py-2 bg-[var(--surface-light)] hover:bg-[var(--primary)]/20 border border-[var(--border)] hover:border-[var(--primary)] rounded-xl transition-all text-sm font-medium"
                            >
                                Hoje
                            </button>
                        </div>

                        {/* Dias da semana */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-medium text-[var(--text-muted)] py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid de dias */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((dayInfo, index) => {
                                const dayJobs = getJobsForDate(dayInfo.date);
                                const holiday = getHolidayForDate(dayInfo.date);
                                const isSelected = selectedDate &&
                                    dayInfo.date.getDate() === selectedDate.getDate() &&
                                    dayInfo.date.getMonth() === selectedDate.getMonth() &&
                                    dayInfo.date.getFullYear() === selectedDate.getFullYear();

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(dayInfo.date)}
                                        className={`
                      relative aspect-square p-1 rounded-xl transition-all
                      flex flex-col items-center justify-start
                      ${dayInfo.currentMonth
                                                ? 'hover:bg-[var(--surface-light)]'
                                                : 'opacity-40'
                                            }
                      ${isSelected ? 'ring-2 ring-[var(--primary)] bg-[var(--primary)]/10' : ''}
                      ${isToday(dayInfo.date) && dayInfo.currentMonth
                                                ? 'bg-[var(--primary)]/20 border border-[var(--primary)]'
                                                : ''
                                            }
                    `}
                                    >
                                        <span className={`
                      text-sm font-medium
                      ${isToday(dayInfo.date) && dayInfo.currentMonth ? 'text-[var(--primary)]' : ''}
                      ${holiday && dayInfo.currentMonth ? 'text-red-400' : ''}
                    `}>
                                            {dayInfo.day}
                                        </span>

                                        {/* Indicadores */}
                                        <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                                            {holiday && dayInfo.currentMonth && (
                                                <span className="text-xs" title={holiday.nome}>
                                                    {holiday.emoji}
                                                </span>
                                            )}
                                            {dayJobs.length > 0 && dayInfo.currentMonth && (
                                                <span className={`
                          w-2 h-2 rounded-full
                          ${dayJobs.some(j => j.status === 'pending') ? 'bg-amber-400' : ''}
                          ${dayJobs.every(j => j.status === 'sent') ? 'bg-emerald-400' : ''}
                          ${dayJobs.some(j => j.status === 'failed') ? 'bg-red-400' : ''}
                        `} />
                                            )}
                                        </div>

                                        {/* Contador de jobs */}
                                        {dayJobs.length > 0 && dayInfo.currentMonth && (
                                            <span className="absolute bottom-1 right-1 text-[10px] bg-[var(--surface-light)] px-1 rounded">
                                                {dayJobs.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legenda */}
                        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-amber-400" />
                                <span>Pendente</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                                <span>Enviado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-400" />
                                <span>Falhou</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <PartyPopper className="w-4 h-4 text-red-400" />
                                <span>Feriado/Data Comemorativa</span>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes do dia selecionado */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-[var(--primary)]" />
                                {selectedDate
                                    ? selectedDate.toLocaleDateString('pt-BR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })
                                    : 'Selecione um dia'
                                }
                            </h3>
                        </div>

                        {selectedDate && (
                            <>
                                {/* Feriado */}
                                {selectedDayHoliday && (
                                    <div className={`
                    p-4 rounded-xl mb-4
                    ${selectedDayHoliday.tipo === 'feriado'
                                            ? 'bg-red-500/10 border border-red-500/30'
                                            : 'bg-purple-500/10 border border-purple-500/30'
                                        }
                  `}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{selectedDayHoliday.emoji}</span>
                                            <div>
                                                <p className="font-medium">{selectedDayHoliday.nome}</p>
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    {selectedDayHoliday.tipo === 'feriado'
                                                        ? 'Feriado Nacional'
                                                        : 'Data Comemorativa'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Agendamentos do dia */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-[var(--text-muted)]">
                                            Agendamentos ({selectedDayJobs.length})
                                        </h4>
                                        <button
                                            onClick={handleCreateSchedule}
                                            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Criar
                                        </button>
                                    </div>

                                    {selectedDayJobs.length === 0 ? (
                                        <div className="text-center py-8 text-[var(--text-muted)]">
                                            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Nenhum agendamento neste dia</p>
                                        </div>
                                    ) : (
                                        selectedDayJobs.map((job) => (
                                            <div
                                                key={job.id}
                                                className="p-3 bg-[var(--surface-light)] rounded-xl border border-[var(--border)]"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {job.mediaPath && (
                                                        <img
                                                            src={`/uploads/${job.mediaPath}`}
                                                            alt=""
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {getStatusIcon(job.status)}
                                                            <span className="font-medium text-sm truncate">
                                                                {job.account?.name || 'Conta'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-[var(--text-muted)]">
                                                            {formatTime(job.scheduledAt)}
                                                        </p>
                                                        {job.caption && (
                                                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">
                                                                {job.caption}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Dica para datas comemorativas */}
                                {selectedDayHoliday && (
                                    <div className="mt-4 p-4 bg-[var(--surface-light)] rounded-xl border border-[var(--border)]">
                                        <p className="text-sm text-[var(--text-muted)]">
                                            💡 <strong>Dica:</strong> Aproveite o "{selectedDayHoliday.nome}" para
                                            criar conteúdos temáticos e engajar seu público!
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {!selectedDate && (
                            <div className="text-center py-12 text-[var(--text-muted)]">
                                <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p>Clique em um dia no calendário para ver os detalhes</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Próximos Feriados */}
                <div className="mt-6 glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <PartyPopper className="w-5 h-5 text-[var(--primary)]" />
                        Próximos Feriados e Datas Comemorativas
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Object.entries(holidays)
                            .map(([key, value]) => {
                                const [m, d] = key.split('-').map(Number);
                                const date = new Date(year, m - 1, d);
                                return { ...value, date, key };
                            })
                            .filter(h => h.date >= new Date())
                            .sort((a, b) => a.date - b.date)
                            .slice(0, 12)
                            .map((holiday) => (
                                <button
                                    key={holiday.key}
                                    onClick={() => {
                                        setCurrentDate(new Date(holiday.date.getFullYear(), holiday.date.getMonth(), 1));
                                        setSelectedDate(holiday.date);
                                    }}
                                    className="p-3 bg-[var(--surface-light)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] transition-all text-left"
                                >
                                    <span className="text-xl">{holiday.emoji}</span>
                                    <p className="font-medium text-sm mt-1 line-clamp-1">{holiday.nome}</p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {holiday.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </p>
                                </button>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
