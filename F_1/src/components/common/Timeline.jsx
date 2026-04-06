import { Check, Clock } from 'lucide-react';

export default function Timeline({ steps }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                step.completed ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              {step.completed ? <Check size={20} /> : <span>{index + 1}</span>}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-1 h-12 ${
                  step.completed ? 'bg-green-600' : 'bg-gray-300'
                }`}
              ></div>
            )}
          </div>

          {/* Step content */}
          <div className="pt-2 pb-4">
            <h4 className="font-semibold text-gray-900">{step.title}</h4>
            {step.description && <p className="text-gray-600 text-sm mt-1">{step.description}</p>}
            {step.timestamp && <p className="text-gray-500 text-xs mt-2 flex items-center gap-1"><Clock size={12} /> {step.timestamp}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
