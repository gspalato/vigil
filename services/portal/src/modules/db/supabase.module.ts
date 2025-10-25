import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT', // A token to inject the Supabase client
      useFactory: (configService: ConfigService): SupabaseClient => {
        const supabaseUrl = configService.get<string>('SUPABASE_URL');
        const supabaseKey = configService.get<string>('SUPABASE_KEY');

        if (!supabaseUrl)
          throw new Error('Missing SUPABASE_URL environment variable.');

        if (!supabaseKey)
          throw new Error('Missing SUPABASE_KEY environment variable.');

        return createClient(supabaseUrl, supabaseKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SUPABASE_CLIENT'], // Export the client for use in other modules
})
export class SupabaseModule {}
