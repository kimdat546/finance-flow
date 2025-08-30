import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TransactionData {
  type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt_payment' | 'debt_charge';
  amount: number;
  category: string;
  purpose: string;
  counterparty?: string;
  account: string;
  payment_method: 'tiền mặt' | 'thẻ tín dụng' | 'chuyển khoản' | 'ví điện tử' | 'khác';
  date: string;
  summary: string;
}

const AI_PROMPT = `
Hãy phân tích tin nhắn sau và trích xuất tất cả các giao dịch tài chính. Với mỗi giao dịch, hãy trả về:

- type: loại giao dịch [income, expense, transfer, investment, debt_payment, debt_charge]
- amount: số tiền liên quan (chỉ số, không có ký hiệu tiền tệ)
- category: chọn một trong các mục [Thuê nhà, Ăn uống, Đồ uống, Xăng xe, Giải trí, Tiện ích, Mua sắm, Y tế, Nhà ở, Giáo dục, Giao thông, Đầu tư, Tiết kiệm, Trả nợ, Thẻ tín dụng, Ngân hàng, Bảo hiểm, Làm đẹp, Khác]
- purpose: mô tả ngắn gọn mục đích (ví dụ: "trả tiền thuê nhà", "mua cơm trưa", "chuyển tiền tiết kiệm")
- counterparty: người hoặc tổ chức liên quan (nếu có)
- account: tài khoản/thẻ được sử dụng (ví dụ: "Vietcombank", "BIDV Credit Card", "Tiền mặt")
- payment_method: phương thức thanh toán [tiền mặt, thẻ tín dụng, chuyển khoản, ví điện tử, khác]
- date: nếu không có ngày cụ thể, lấy ngày hôm nay
- summary: tóm tắt ngắn gọn giao dịch

Lưu ý quan trọng:
- Chỉ trích xuất các giao dịch tài chính thực tế, bỏ qua tin nhắn không liên quan
- Đảm bảo amount luôn là số dương
- Nếu không rõ category, chọn "Khác"
- Nếu không rõ account, ghi "Không xác định"
- Hỗ trợ cả tiếng Việt và tiếng Anh
- Tự động nhận diện số tiền từ nhiều định dạng (42$, $42, 42 USD, 42k, 1.5M)

Trả về kết quả dưới dạng một mảng JSON các object, mỗi object là một giao dịch.
Nếu không tìm thấy giao dịch nào, trả về mảng rỗng [].
`;

export class AIProcessor {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async processMessage(message: string): Promise<TransactionData[]> {
    try {
      const prompt = `${AI_PROMPT}\n\nTin nhắn cần phân tích: "${message}"`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\[.*\]/s);
      if (!jsonMatch) {
        console.log('No JSON found in AI response:', text);
        return [];
      }

      const transactions: TransactionData[] = JSON.parse(jsonMatch[0]);
      
      // Validate and clean up the data
      return transactions.map(this.validateTransaction).filter(Boolean) as TransactionData[];

    } catch (error) {
      console.error('AI processing error:', error);
      throw new Error('Failed to process message with AI');
    }
  }

  private validateTransaction(transaction: any): TransactionData | null {
    try {
      // Ensure required fields exist and are valid
      if (!transaction.amount || isNaN(parseFloat(transaction.amount))) {
        return null;
      }

      const validTypes = ['income', 'expense', 'transfer', 'investment', 'debt_payment', 'debt_charge'];
      if (!validTypes.includes(transaction.type)) {
        transaction.type = 'expense'; // Default to expense
      }

      const validPaymentMethods = ['tiền mặt', 'thẻ tín dụng', 'chuyển khoản', 'ví điện tử', 'khác'];
      if (!validPaymentMethods.includes(transaction.payment_method)) {
        transaction.payment_method = 'tiền mặt'; // Default
      }

      // Ensure amount is positive number
      transaction.amount = Math.abs(parseFloat(transaction.amount));

      // Set defaults for optional fields
      transaction.category = transaction.category || 'Khác';
      transaction.account = transaction.account || 'Không xác định';
      transaction.purpose = transaction.purpose || transaction.summary || 'Giao dịch tài chính';
      
      // Validate date format
      if (transaction.date) {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          transaction.date = new Date().toISOString().split('T')[0];
        }
      } else {
        transaction.date = new Date().toISOString().split('T')[0];
      }

      return transaction;

    } catch (error) {
      console.error('Transaction validation error:', error);
      return null;
    }
  }

  async saveTransaction(userId: string, transaction: TransactionData, source: string, rawMessage: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.purpose,
          counterparty: transaction.counterparty,
          account_name: transaction.account,
          payment_method: transaction.payment_method,
          transaction_date: transaction.date,
          notes: transaction.summary,
          source: source,
          raw_message: rawMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      // Update account balance if account exists
      await this.updateAccountBalance(userId, transaction.account, transaction.amount, transaction.type);

      return data;

    } catch (error) {
      console.error('Save transaction error:', error);
      throw error;
    }
  }

  private async updateAccountBalance(userId: string, accountName: string, amount: number, type: string) {
    if (accountName === 'Không xác định') return;

    try {
      // Find or create account
      const { data: account, error: findError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('name', accountName)
        .single();

      let accountId: string;

      if (findError && findError.code === 'PGRST116') {
        // Account doesn't exist, create it
        const { data: newAccount, error: createError } = await supabase
          .from('accounts')
          .insert({
            user_id: userId,
            name: accountName,
            type: 'checking', // Default type
            balance: 0,
            currency: 'VND',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        accountId = newAccount.id;
      } else if (account) {
        accountId = account.id;
      } else {
        throw findError;
      }

      // Calculate balance change
      let balanceChange = 0;
      switch (type) {
        case 'income':
          balanceChange = amount;
          break;
        case 'expense':
          balanceChange = -amount;
          break;
        case 'transfer':
          // Handle transfers separately
          break;
        default:
          balanceChange = type.includes('debt') ? -amount : amount;
      }

      if (balanceChange !== 0) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            balance: supabase.sql`balance + ${balanceChange}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', accountId);

        if (updateError) throw updateError;
      }

    } catch (error) {
      console.error('Account balance update error:', error);
      // Don't throw - transaction should still be saved even if balance update fails
    }
  }
}

export const aiProcessor = new AIProcessor();