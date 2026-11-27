import React from 'react';
import { X, HelpCircle, Dices, Brain, Target, Trophy } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-[scaleIn_0.2s_ease-out] border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="text-indigo-500" />
            Hướng dẫn chơi
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
          
          <div className="flex gap-4">
            <div className="bg-indigo-100 p-2.5 rounded-lg h-fit">
              <Dices className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1">1. Tung xúc xắc</h3>
              <p>Mỗi lượt chơi bắt đầu bằng việc tung xúc xắc. Điểm từ 1 đến 6 trên xúc xắc sẽ quyết định độ khó của câu hỏi bạn phải trả lời.</p>
              <ul className="mt-2 space-y-1 ml-4 list-disc text-slate-500">
                <li>1-2: Câu hỏi Dễ</li>
                <li>3-4: Câu hỏi Trung bình</li>
                <li>5-6: Câu hỏi Khó</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-emerald-100 p-2.5 rounded-lg h-fit">
              <Brain className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1">2. Trả lời câu hỏi</h3>
              <p>AI sẽ tự động tạo ra câu hỏi Tự luận hoặc Trắc nghiệm dựa trên chủ đề và lớp bạn đã chọn. Hãy suy nghĩ thật kỹ trước khi đưa ra câu trả lời cuối cùng nhé!</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-amber-100 p-2.5 rounded-lg h-fit">
              <Target className="text-amber-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1">3. Tính điểm</h3>
              <p>Điểm nhận được phụ thuộc vào chất lượng câu trả lời (nếu là tự luận) và độ khó của xúc xắc.</p>
              <p className="mt-1">Ngoài ra, nếu trả lời đúng liên tiếp, bạn sẽ có Chuỗi (Streak) giúp nhân thêm điểm thưởng!</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-purple-100 p-2.5 rounded-lg h-fit">
              <Trophy className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-1">4. Khám phá Lịch sử</h3>
              <p>Đừng buồn nếu trả lời sai. Mỗi câu trả lời (dù đúng hay sai) đều đi kèm giải thích và một sự thật lịch sử thú vị (Fun fact) giúp bạn học và nhớ lâu hơn.</p>
            </div>
          </div>

        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          Đã hiểu, Bắt đầu chơi!
        </button>
      </div>
    </div>
  );
};

export default HelpModal;
