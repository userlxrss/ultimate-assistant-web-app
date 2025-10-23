import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

export const moodChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      labels: {
        color: 'rgba(107, 114, 128, 0.8)',
        usePointStyle: true,
        padding: 20,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1f2937',
      bodyColor: '#4b5563',
      borderColor: 'rgba(107, 114, 128, 0.2)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function(context: any) {
          return `${context.dataset.label}: ${context.parsed.y}/10`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        borderColor: 'rgba(107, 114, 128, 0.1)',
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.6)',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      }
    },
    y: {
      min: 0,
      max: 10,
      grid: {
        color: 'rgba(107, 114, 128, 0.1)',
        borderColor: 'rgba(107, 114, 128, 0.2)',
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.6)',
        stepSize: 2,
      }
    }
  }
};

export const productivityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: 'rgba(107, 114, 128, 0.8)',
        usePointStyle: true,
        padding: 20,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1f2937',
      bodyColor: '#4b5563',
      borderColor: 'rgba(107, 114, 128, 0.2)',
      borderWidth: 1,
      padding: 12,
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        borderColor: 'rgba(107, 114, 128, 0.1)',
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.6)',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
      }
    },
    y: {
      grid: {
        color: 'rgba(107, 114, 128, 0.1)',
        borderColor: 'rgba(107, 114, 128, 0.2)',
      },
      ticks: {
        color: 'rgba(107, 114, 128, 0.6)',
      }
    }
  }
};

export const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: 'rgba(107, 114, 128, 0.8)',
        usePointStyle: true,
        padding: 15,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1f2937',
      bodyColor: '#4b5563',
      borderColor: 'rgba(107, 114, 128, 0.2)',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: function(context: any) {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.label}: ${context.parsed} (${percentage}%)`;
        }
      }
    }
  }
};

export const createMoodGradient = (ctx: CanvasRenderingContext2D) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(185, 164, 225, 0.4)'); // soft-lavender-500
  gradient.addColorStop(1, 'rgba(185, 164, 225, 0.05)');
  return gradient;
};

export const createEnergyGradient = (ctx: CanvasRenderingContext2D) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(105, 180, 145, 0.4)'); // sage-500
  gradient.addColorStop(1, 'rgba(105, 180, 145, 0.05)');
  return gradient;
};