import { supabase } from '../supabase'
import { Category, PaymentMethod } from '../database.types'

export class ReferenceService {
  // Get all categories
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data
  }

  // Get categories by type
  static async getCategoriesByType(type: Category['type']) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data
  }

  // Get all payment methods
  static async getPaymentMethods() {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data
  }

  // Create category
  static async createCategory(category: {
    name: string
    type: Category['type']
    parent_id?: string
    description?: string
  }) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Create payment method
  static async createPaymentMethod(paymentMethod: {
    name: string
    category: PaymentMethod['category']
    description?: string
  }) {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([paymentMethod])
      .select()
      .single()

    if (error) throw error
    return data
  }
}