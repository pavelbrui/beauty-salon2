import { supabase } from './supabase';

interface EmailData {
  userId: string;
  bookingId: string;
  templateName: string;
  variables: Record<string, string>;
}

export const sendEmail = async ({ userId, bookingId, templateName, variables }: EmailData) => {
  try {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (templateError) throw templateError;

    // Replace variables in template
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(`{{${key}}}`, value);
    });

    // Create notification record
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        booking_id: bookingId,
        template_id: template.id,
        status: 'pending'
      });

    if (notificationError) throw notificationError;

    // In a real application, you would integrate with an email service here
    console.log('Email sent:', {
      subject: template.subject,
      content,
      userId
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};